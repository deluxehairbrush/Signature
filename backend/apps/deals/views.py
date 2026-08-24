from django.db import models as db_models
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reputation.services import (
    process_deal_cancellation,
    process_deal_completion,
    process_deal_dispute,
    recalculate_reputation,
)

from .models import CompletionConfirmation, Deal, DealMessage, Notification
from .serializers import (
    CompletionConfirmationSerializer,
    DealCreateSerializer,
    DealDetailSerializer,
    DealListSerializer,
    DealMessageSerializer,
    NotificationSerializer,
    OpenDealSerializer,
)
from .services import (
    InvalidTransition,
    build_proof_response,
    create_deal_snapshot,
    transition_deal,
)


def notify(recipient, deal, verb, message):
    """Create a notification, skipping silently if there's no one to notify
    (e.g. a deal with no freelancer assigned yet)."""
    if recipient is None:
        return
    Notification.objects.create(recipient=recipient, deal=deal, verb=verb, message=message)


class IsDealParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.client == request.user or obj.freelancer == request.user
        return obj.client == request.user or obj.freelancer == request.user


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsDealParticipant]

    def get_permissions(self):
        # "apply" is the one action a non-participant is meant to hit — the
        # whole point is claiming a deal you're not part of yet.
        if self.action == "apply":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        if self.action == "apply":
            return Deal.objects.filter(is_open_to_proposals=True, freelancer__isnull=True, status="DRAFT")
        return Deal.objects.filter(
            db_models.Q(client=user) | db_models.Q(freelancer=user)
        ).select_related("client", "freelancer").prefetch_related("tags")

    def get_serializer_class(self):
        if self.action == "list":
            return DealListSerializer
        if self.action == "create":
            return DealCreateSerializer
        return DealDetailSerializer

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    # ---- State transition actions ----

    @action(detail=True, methods=["post"], url_path="propose")
    def propose(self, request, pk=None):
        """POST /api/v1/deals/{id}/propose/

        Move a DRAFT deal to PROPOSED.  Only the client (deal owner) may
        propose, and a freelancer must be assigned.
        """
        deal = self.get_object()
        if deal.client != request.user:
            return Response(
                {"success": False, "error": {"code": "NOT_OWNER", "message": "Only the deal owner can propose a deal."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not deal.freelancer:
            return Response(
                {"success": False, "error": {"code": "NO_FREELANCER", "message": "A freelancer must be assigned before proposing."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            transition_deal(deal, "PROPOSED")
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notify(deal.freelancer, deal, Notification.Verb.PROPOSED, f'"{deal.title}" was proposed to you.')
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        """POST /api/v1/deals/{id}/accept/

        Only the freelancer (counterparty) may accept a proposed deal.
        """
        deal = self.get_object()
        if deal.freelancer != request.user:
            return Response(
                {"success": False, "error": {"code": "NOT_COUNTERPARTY", "message": "Only the assigned freelancer can accept a deal."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            transition_deal(deal, "ACCEPTED")
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notify(deal.client, deal, Notification.Verb.ACCEPTED, f'{deal.freelancer.username} accepted "{deal.title}".')
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="sign")
    def sign(self, request, pk=None):
        """POST /api/v1/deals/{id}/sign/"""
        from apps.signatures.services import sign_deal

        deal = self.get_object()
        try:
            sign_deal(deal, request.user, request)
        except ValueError as e:
            return Response(
                {"success": False, "error": {"code": "SIGNATURE_ERROR", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deal.refresh_from_db()
        other = deal.freelancer if request.user == deal.client else deal.client
        notify(other, deal, Notification.Verb.SIGNED, f'{request.user.username} signed "{deal.title}".')
        return Response({"success": True, "message": "Signed successfully.", "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """POST /api/v1/deals/{id}/complete/

        Only the client may unilaterally mark a deal complete.
        Both parties should submit completion confirmations afterward.
        """
        deal = self.get_object()
        if deal.client != request.user:
            return Response(
                {"success": False, "error": {"code": "NOT_CLIENT", "message": "Only the client can mark a deal as completed."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            transition_deal(deal, "COMPLETED")
            create_deal_snapshot(deal)
            # Wire up the reputation pipeline — record events, then rebuild scores
            process_deal_completion(deal)
            recalculate_reputation(deal)
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notify(deal.freelancer, deal, Notification.Verb.COMPLETED, f'"{deal.title}" was marked complete.')
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """POST /api/v1/deals/{id}/cancel/"""
        deal = self.get_object()
        try:
            transition_deal(deal, "CANCELLED")
            process_deal_cancellation(deal)
            recalculate_reputation(deal)
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        other = deal.freelancer if request.user == deal.client else deal.client
        notify(other, deal, Notification.Verb.CANCELLED, f'"{deal.title}" was cancelled.')
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="dispute")
    def dispute(self, request, pk=None):
        """POST /api/v1/deals/{id}/dispute/"""
        deal = self.get_object()
        try:
            transition_deal(deal, "DISPUTED")
            process_deal_dispute(deal)
            recalculate_reputation(deal)
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        other = deal.freelancer if request.user == deal.client else deal.client
        notify(other, deal, Notification.Verb.DISPUTED, f'"{deal.title}" was disputed.')
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="apply")
    def apply(self, request, pk=None):
        """POST /api/v1/deals/{id}/apply/

        A freelancer claims an open, unassigned deal. First come, first
        served — not a multi-candidate application queue.
        """
        deal = self.get_object()
        if getattr(request.user, "user_type", None) != "FREELANCER":
            return Response(
                {"success": False, "error": {"code": "NOT_FREELANCER", "message": "Only freelancer accounts can apply."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not deal.is_open_to_proposals or deal.freelancer is not None or deal.status != "DRAFT":
            return Response(
                {"success": False, "error": {"code": "NOT_OPEN", "message": "This deal isn't open to proposals."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deal.freelancer = request.user
        deal.is_open_to_proposals = False
        deal.save(update_fields=["freelancer", "is_open_to_proposals"])
        notify(deal.client, deal, Notification.Verb.APPLIED, f'{request.user.username} applied to "{deal.title}".')
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["get"], url_path="proof")
    def proof(self, request, pk=None):
        """GET /api/v1/deals/{id}/proof/"""
        deal = self.get_object()
        return Response({"success": True, "proof": build_proof_response(deal)})

    @action(detail=True, methods=["get", "post"], url_path="completion")
    def completion(self, request, pk=None):
        """GET/POST /api/v1/deals/{id}/completion/"""
        deal = self.get_object()

        if request.method == "GET":
            confirmations = deal.completions.all()
            return Response({
                "success": True,
                "completions": CompletionConfirmationSerializer(confirmations, many=True).data,
            })

        # POST — submit confirmation
        if deal.client != request.user and deal.freelancer != request.user:
            return Response(
                {"success": False, "error": {"code": "NOT_PARTICIPANT", "message": "Only deal participants can submit confirmation."}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Only accept confirmations for completed deals
        if deal.status != "COMPLETED":
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS", "message": "Completion confirmations can only be submitted for completed deals."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CompletionConfirmationSerializer(
            data=request.data, context={"request": request, "view": self}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "confirmation": serializer.data}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request, pk=None):
        """GET/POST /api/v1/deals/{id}/messages/ — a chat thread scoped to this deal."""
        deal = self.get_object()

        if request.method == "GET":
            thread = deal.messages.select_related("sender")
            return Response({
                "success": True,
                "messages": DealMessageSerializer(thread, many=True).data,
            })

        serializer = DealMessageSerializer(
            data=request.data, context={"request": request, "view": self}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        other = deal.freelancer if request.user == deal.client else deal.client
        notify(other, deal, Notification.Verb.MESSAGE, f'New message on "{deal.title}".')

        return Response({"success": True, "message_obj": serializer.data}, status=status.HTTP_201_CREATED)


class OpenDealListView(generics.ListAPIView):
    """GET /api/v1/deals/open/ — deals a client has opened up for proposals."""

    serializer_class = OpenDealSerializer
    permission_classes = [permissions.AllowAny]
    queryset = (
        Deal.objects.filter(is_open_to_proposals=True, freelancer__isnull=True, status="DRAFT")
        .select_related("client")
        .prefetch_related("tags")
    )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/notifications/ and /api/v1/notifications/{id}/read/"""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).select_related("deal")

    @action(detail=True, methods=["post"], url_path="read")
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response({"success": True, "notification": NotificationSerializer(notification).data})

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"success": True})

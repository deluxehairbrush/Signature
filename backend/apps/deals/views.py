from django.db import models as db_models
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reputation.services import recalculate_reputation

from .models import CompletionConfirmation, Deal
from .serializers import (
    CompletionConfirmationSerializer,
    DealCreateSerializer,
    DealDetailSerializer,
    DealListSerializer,
)
from .services import (
    InvalidTransition,
    build_proof_response,
    create_deal_snapshot,
    transition_deal,
)


class IsDealParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return obj.client == request.user or obj.freelancer == request.user
        return obj.client == request.user or obj.freelancer == request.user


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsDealParticipant]

    def get_queryset(self):
        user = self.request.user
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

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        """POST /api/v1/deals/{id}/accept/"""
        deal = self.get_object()
        if deal.freelancer != request.user and deal.client != request.user:
            return Response(
                {"success": False, "error": {"code": "NOT_PARTICIPANT", "message": "Only deal participants can accept."}},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            transition_deal(deal, "ACCEPTED")
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
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
        return Response({"success": True, "message": "Signed successfully.", "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """POST /api/v1/deals/{id}/complete/"""
        deal = self.get_object()
        try:
            transition_deal(deal, "COMPLETED")
            create_deal_snapshot(deal)
            recalculate_reputation(deal)
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        """POST /api/v1/deals/{id}/cancel/"""
        deal = self.get_object()
        try:
            transition_deal(deal, "CANCELLED")
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"success": True, "deal": DealDetailSerializer(deal).data})

    @action(detail=True, methods=["post"], url_path="dispute")
    def dispute(self, request, pk=None):
        """POST /api/v1/deals/{id}/dispute/"""
        deal = self.get_object()
        try:
            transition_deal(deal, "DISPUTED")
        except InvalidTransition as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_STATUS_TRANSITION", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
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
        serializer = CompletionConfirmationSerializer(
            data=request.data, context={"request": request, "view": self}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "confirmation": serializer.data}, status=status.HTTP_201_CREATED)

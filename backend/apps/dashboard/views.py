from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.deals.models import Deal
from apps.profiles.models import ClientProfile, FreelancerProfile
from apps.profiles.serializers import ClientProfileSerializer, FreelancerProfileSerializer
from apps.profiles.services import calculate_profile_completion
from apps.reputation.models import UserReputation


class FreelancerDashboardView(APIView):
    """GET /api/v1/dashboard/freelancer/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = FreelancerProfile.objects.filter(user=user).first()
        if profile:
            profile_data = FreelancerProfileSerializer(profile).data
            completion = calculate_profile_completion(profile)
        else:
            profile_data = None
            completion = {"completion_percentage": 0, "missing_fields": ["profile"]}

        # Deals
        active_deals = Deal.objects.filter(freelancer=user, status__in=["ACCEPTED", "ACTIVE"]).select_related("client")
        completed_deals = Deal.objects.filter(freelancer=user, status="COMPLETED").select_related("client")
        pending_signatures = Deal.objects.filter(
            freelancer=user, status="ACCEPTED"
        ).exclude(signatures__signer=user, signatures__status="VALID")

        rep, _ = UserReputation.objects.get_or_create(user=user)

        return Response({
            "success": True,
            "profile": profile_data,
            "profile_completion": completion,
            "reputation": {
                "score": rep.score,
                "completed_deals": rep.completed_deals,
                "on_time_completions": rep.on_time_completions,
            },
            "active_deals_count": active_deals.count(),
            "completed_deals_count": completed_deals.count(),
            "pending_signatures_count": pending_signatures.count(),
            "availability": profile.availability_status if profile else None,
            "recent_collaborations": [
                {
                    "deal_id": str(d.public_id),
                    "title": d.title,
                    "client": d.client.username,
                    "status": d.status,
                }
                for d in completed_deals[:5]
            ],
        })


class ClientDashboardView(APIView):
    """GET /api/v1/dashboard/client/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile = ClientProfile.objects.get(user=user)
            profile_data = ClientProfileSerializer(profile).data
        except ClientProfile.DoesNotExist:
            profile_data = None

        active_deals = Deal.objects.filter(client=user, status__in=["ACCEPTED", "ACTIVE"]).select_related("freelancer")
        pending_proposals = Deal.objects.filter(client=user, status="PROPOSED").select_related("freelancer")
        completed_deals = Deal.objects.filter(client=user, status="COMPLETED").select_related("freelancer")
        pending_signatures = Deal.objects.filter(
            client=user, status="ACCEPTED"
        ).exclude(signatures__signer=user, signatures__status="VALID")

        # Freelancers collaborated with
        collaborator_usernames = (
            completed_deals.values_list("freelancer__username", flat=True).distinct()
        )

        return Response({
            "success": True,
            "profile": profile_data,
            "active_deals_count": active_deals.count(),
            "pending_proposals_count": pending_proposals.count(),
            "completed_deals_count": completed_deals.count(),
            "pending_signatures_count": pending_signatures.count(),
            "freelancers_collaborated": list(collaborator_usernames),
            "recent_deals": [
                {
                    "deal_id": str(d.public_id),
                    "title": d.title,
                    "freelancer": d.freelancer.username if d.freelancer else None,
                    "status": d.status,
                }
                for d in (active_deals | completed_deals)[:5]
            ],
        })

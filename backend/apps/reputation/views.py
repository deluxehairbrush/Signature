from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserReputation
from .serializers import ReputationSerializer

User = get_user_model()


class PublicReputationView(APIView):
    """GET /api/v1/reputation/{username}/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        rep, _ = UserReputation.objects.get_or_create(user=user)
        return Response({"success": True, "reputation": ReputationSerializer(rep).data})

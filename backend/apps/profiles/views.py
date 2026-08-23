from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClientProfile, FreelancerProfile, SocialLink
from .serializers import (
    ClientProfileSerializer,
    FreelancerProfileSerializer,
    PublicClientSerializer,
    PublicFreelancerSerializer,
    SocialLinkSerializer,
)
from .services import calculate_client_profile_completion, calculate_profile_completion

User = get_user_model()


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class FreelancerProfileViewSet(viewsets.ModelViewSet):
    """CRUD for the current user's freelancer profile."""

    serializer_class = FreelancerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return FreelancerProfile.objects.filter(user=self.request.user).select_related("user").prefetch_related("tags", "social_links")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="completion")
    def completion(self, request):
        """GET /api/v1/freelancers/profile/completion/"""
        try:
            profile = FreelancerProfile.objects.get(user=request.user)
        except FreelancerProfile.DoesNotExist:
            return Response(
                {"completion_percentage": 0, "missing_fields": ["profile"]},
                status=status.HTTP_200_OK,
            )
        return Response(calculate_profile_completion(profile))


class ClientProfileViewSet(viewsets.ModelViewSet):
    """CRUD for the current user's client profile."""

    serializer_class = ClientProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return ClientProfile.objects.filter(user=self.request.user).select_related("user").prefetch_related("tags")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="completion")
    def completion(self, request):
        """GET /api/v1/clients/profile/completion/"""
        try:
            profile = ClientProfile.objects.get(user=request.user)
        except ClientProfile.DoesNotExist:
            return Response(
                {"completion_percentage": 0, "missing_fields": ["profile"]},
                status=status.HTTP_200_OK,
            )
        return Response(calculate_client_profile_completion(profile))


class PublicFreelancerView(APIView):
    """GET /api/v1/freelancers/{username}/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        profile = FreelancerProfile.objects.filter(user=user).select_related("user").prefetch_related("tags", "social_links").first()
        if profile is None:
            return Response(
                {"success": False, "error": {"code": "NOT_FOUND", "message": "Freelancer profile not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"success": True, "profile": PublicFreelancerSerializer(profile).data})


class PublicClientView(APIView):
    """GET /api/v1/clients/{username}/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        profile = ClientProfile.objects.filter(user=user).select_related("user").prefetch_related("tags").first()
        if profile is None:
            return Response(
                {"success": False, "error": {"code": "NOT_FOUND", "message": "Client profile not found."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"success": True, "profile": PublicClientSerializer(profile).data})


class SocialLinkViewSet(viewsets.ModelViewSet):
    serializer_class = SocialLinkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SocialLink.objects.filter(freelancer__user=self.request.user)

    def perform_create(self, serializer):
        profile = FreelancerProfile.objects.get(user=self.request.user)
        serializer.save(freelancer=profile)

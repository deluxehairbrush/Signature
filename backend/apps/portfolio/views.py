from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import FreelancerProfile

from .models import PortfolioItem
from .serializers import PortfolioItemSerializer, PublicPortfolioItemSerializer

User = get_user_model()


class IsPortfolioOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.freelancer.user == request.user


class PortfolioItemViewSet(viewsets.ModelViewSet):
    """CRUD for the current user's portfolio items."""

    serializer_class = PortfolioItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsPortfolioOwner]

    def get_queryset(self):
        return PortfolioItem.objects.filter(
            freelancer__user=self.request.user
        ).select_related("freelancer")

    def perform_create(self, serializer):
        profile = FreelancerProfile.objects.get(user=self.request.user)
        serializer.save(freelancer=profile)


class PublicPortfolioView(APIView):
    """GET /api/v1/portfolio/{username}/ — a freelancer's public, visible items."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        items = PortfolioItem.objects.filter(
            freelancer__user=user, is_public=True
        ).select_related("freelancer")
        return Response(
            {"success": True, "items": PublicPortfolioItemSerializer(items, many=True).data}
        )

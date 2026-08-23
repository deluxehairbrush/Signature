from rest_framework import permissions, viewsets

from apps.profiles.models import FreelancerProfile

from .models import PortfolioItem
from .serializers import PortfolioItemSerializer


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

from django.db.models import Q
from django_filters import rest_framework as filters
from rest_framework import permissions, viewsets

from apps.profiles.models import ClientProfile, FreelancerProfile
from apps.profiles.serializers import PublicClientSerializer, PublicFreelancerSerializer


class FreelancerFilter(filters.FilterSet):
    tags = filters.CharFilter(method="filter_tags")
    min_rate = filters.NumberFilter(field_name="hourly_rate", lookup_expr="gte")
    max_rate = filters.NumberFilter(field_name="hourly_rate", lookup_expr="lte")
    min_reputation = filters.NumberFilter(field_name="reputation_score", lookup_expr="gte")

    class Meta:
        model = FreelancerProfile
        fields = ["availability_status"]

    def filter_tags(self, queryset, name, value):
        tag_names = [t.strip() for t in value.split(",") if t.strip()]
        return queryset.filter(tags__slug__in=tag_names).distinct()


class ClientFilter(filters.FilterSet):
    tags = filters.CharFilter(method="filter_tags")

    class Meta:
        model = ClientProfile
        fields = ["industry"]

    def filter_tags(self, queryset, name, value):
        tag_names = [t.strip() for t in value.split(",") if t.strip()]
        return queryset.filter(tags__slug__in=tag_names).distinct()


class FreelancerSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/freelancers/?search=python&tags=python,django&availability=AVAILABLE&min_rate=10&max_rate=50&min_reputation=70
    """

    queryset = FreelancerProfile.objects.select_related("user").prefetch_related("tags", "social_links")
    serializer_class = PublicFreelancerSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = FreelancerFilter
    search_fields = ["user__username", "user__first_name", "user__last_name", "headline", "bio"]
    ordering_fields = ["reputation_score", "hourly_rate", "completed_deals", "created_at"]


class ClientSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/clients/?search=company&industry=tech&tags=python
    """

    queryset = ClientProfile.objects.select_related("user").prefetch_related("tags")
    serializer_class = PublicClientSerializer
    permission_classes = [permissions.AllowAny]
    filterset_class = ClientFilter
    search_fields = ["user__username", "company_name", "description"]
    ordering_fields = ["created_at"]

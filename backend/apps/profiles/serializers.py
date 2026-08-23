from rest_framework import serializers

from apps.tags.serializers import TagSerializer

from .models import ClientProfile, FreelancerProfile, SocialLink


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ["id", "platform", "url"]
        read_only_fields = ["id"]


class FreelancerProfileSerializer(serializers.ModelSerializer):
    social_links = SocialLinkSerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = FreelancerProfile
        fields = [
            "id", "username", "email", "full_name", "display_name", "headline",
            "bio", "location", "timezone", "hourly_rate", "currency",
            "availability_status", "working_hours", "reputation_score",
            "completed_deals", "successful_deals", "tags", "social_links",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "username", "email", "reputation_score",
            "completed_deals", "successful_deals", "created_at", "updated_at",
        ]

    def get_full_name(self, obj):
        return obj.user.full_name


class PublicFreelancerSerializer(serializers.ModelSerializer):
    """Public-safe serializer — no email or private fields."""
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    social_links = SocialLinkSerializer(many=True, read_only=True)

    class Meta:
        model = FreelancerProfile
        fields = [
            "username", "full_name", "display_name", "headline", "bio",
            "location", "hourly_rate", "currency", "availability_status",
            "working_hours", "reputation_score", "completed_deals",
            "successful_deals", "tags", "social_links",
        ]

    def get_full_name(self, obj):
        return obj.user.full_name


class ClientProfileSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ClientProfile
        fields = [
            "id", "username", "company_name", "description", "website",
            "location", "industry", "tags", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "username", "created_at", "updated_at"]


class PublicClientSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = ClientProfile
        fields = [
            "username", "company_name", "description", "website",
            "location", "industry", "tags",
        ]


class ProfileCompletionSerializer(serializers.Serializer):
    completion_percentage = serializers.FloatField()
    missing_fields = serializers.ListField(child=serializers.CharField())

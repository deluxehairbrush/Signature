from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.tags.models import Tag
from apps.tags.serializers import TagSerializer

from .models import CompletionConfirmation, Deal, DealSnapshot

User = get_user_model()


class DealListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for deal lists."""
    client_username = serializers.CharField(source="client.username", read_only=True)
    freelancer_username = serializers.CharField(
        source="freelancer.username", read_only=True, default=None
    )
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id", "public_id", "title", "client_username", "freelancer_username",
            "compensation_amount", "currency", "status", "deadline",
            "created_at", "tags",
        ]


class DealDetailSerializer(serializers.ModelSerializer):
    """Full deal detail with participants."""
    client_username = serializers.CharField(source="client.username", read_only=True)
    freelancer_username = serializers.CharField(
        source="freelancer.username", read_only=True, default=None
    )
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = [
            "id", "public_id", "client", "client_username",
            "freelancer", "freelancer_username",
            "title", "description", "scope", "deliverables",
            "compensation_amount", "currency", "deadline",
            "working_hours", "terms", "status",
            "tags", "created_at", "updated_at",
            "started_at", "completed_at",
        ]
        read_only_fields = [
            "id", "public_id", "status", "created_at", "updated_at",
            "started_at", "completed_at",
        ]


class DealCreateSerializer(serializers.ModelSerializer):
    """For creating a new deal."""
    tags = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), required=False
    )
    # By username, not pk: nothing in the public API surface (search,
    # public profile) ever exposes a user's numeric id, so a client has no
    # way to address a freelancer except by the username it already knows.
    freelancer = serializers.SlugRelatedField(
        slug_field="username", queryset=User.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Deal
        fields = [
            "title", "description", "scope", "deliverables",
            "compensation_amount", "currency", "deadline",
            "working_hours", "terms", "freelancer", "tags",
        ]

    def create(self, validated_data):
        tags = validated_data.pop("tags", [])
        # client is injected by DealViewSet.perform_create via save(client=...)
        deal = Deal.objects.create(**validated_data)
        deal.tags.set(tags)
        return deal


class CompletionConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompletionConfirmation
        fields = [
            "id", "deal", "submitted_by", "completed_on_time",
            "compensation_received", "compensation_fair",
            "work_satisfactory", "comment", "submitted_at",
        ]
        read_only_fields = ["id", "deal", "submitted_by", "submitted_at"]

    def create(self, validated_data):
        validated_data["submitted_by"] = self.context["request"].user
        validated_data["deal"] = self.context["view"].get_object()
        return super().create(validated_data)


class DealSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealSnapshot
        fields = "__all__"
        read_only_fields = fields

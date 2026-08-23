from rest_framework import serializers
from .models import ReputationRecord, UserReputation


class ReputationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserReputation
        fields = [
            "username", "score", "completed_deals", "on_time_completions",
            "fair_compensation_count", "both_confirmed_count",
            "cancelled_deals", "disputes", "updated_at",
        ]


class ReputationRecordSerializer(serializers.ModelSerializer):
    event_display = serializers.CharField(source="get_event_type_display", read_only=True)

    class Meta:
        model = ReputationRecord
        fields = ["id", "event_type", "event_display", "score_delta", "metadata", "created_at"]

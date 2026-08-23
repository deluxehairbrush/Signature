from rest_framework import serializers
from .models import PortfolioItem


class PortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItem
        fields = [
            "id", "title", "description", "project_url", "image",
            "category", "is_public", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PublicPortfolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioItem
        fields = ["id", "title", "description", "project_url", "image", "category", "created_at"]

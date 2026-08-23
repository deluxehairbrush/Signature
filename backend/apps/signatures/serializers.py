from rest_framework import serializers
from .models import DealSignature


class DealSignatureSerializer(serializers.ModelSerializer):
    signer_username = serializers.CharField(source="signer.username", read_only=True)

    class Meta:
        model = DealSignature
        fields = [
            "id", "deal", "signer", "signer_username", "signer_role",
            "signed_at", "signature_hash", "status",
        ]
        read_only_fields = [
            "id", "signer", "signed_at", "signature_hash", "status",
        ]

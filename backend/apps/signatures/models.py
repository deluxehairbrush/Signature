from django.conf import settings
from django.db import models


class DealSignature(models.Model):
    """Electronic acknowledgment / proof-of-record signature for a deal."""

    class SignerRole(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        FREELANCER = "FREELANCER", "Freelancer"

    class SignatureStatus(models.TextChoices):
        VALID = "VALID", "Valid"
        REVOKED = "REVOKED", "Revoked"

    deal = models.ForeignKey(
        "deals.Deal", on_delete=models.CASCADE, related_name="signatures"
    )
    signer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    signer_role = models.CharField(max_length=20, choices=SignerRole.choices)
    signed_at = models.DateTimeField(auto_now_add=True)
    signature_hash = models.CharField(max_length=64, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=SignatureStatus.choices,
        default=SignatureStatus.VALID,
    )

    class Meta:
        unique_together = ["deal", "signer_role"]
        ordering = ["-signed_at"]

    def __str__(self):
        return f"{self.signer_role} signature on deal {self.deal.public_id}"

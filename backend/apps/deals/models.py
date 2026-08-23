import uuid

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Deal(models.Model):
    """Core deal/collaboration record."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PROPOSED = "PROPOSED", "Proposed"
        ACCEPTED = "ACCEPTED", "Accepted"
        ACTIVE = "ACTIVE", "Active"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        DISPUTED = "DISPUTED", "Disputed"

    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_deals",
    )
    freelancer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="freelancer_deals",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    scope = models.TextField(blank=True)
    deliverables = models.TextField(blank=True)
    compensation_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)],
    )
    currency = models.CharField(max_length=3, default="USD")
    deadline = models.DateTimeField(null=True, blank=True)
    working_hours = models.CharField(max_length=100, blank=True)
    terms = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    tags = models.ManyToManyField("tags.Tag", blank=True, related_name="deals")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.status})"


class DealSnapshot(models.Model):
    """Immutable snapshot of deal terms at time of finalization."""

    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name="snapshot")
    freelancer_name_at_agreement = models.CharField(max_length=200, blank=True)
    client_name_at_agreement = models.CharField(max_length=200, blank=True)
    freelancer_username_at_agreement = models.CharField(max_length=150, blank=True)
    client_username_at_agreement = models.CharField(max_length=150, blank=True)
    agreed_compensation = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    agreed_currency = models.CharField(max_length=3, default="USD")
    agreed_deadline = models.DateTimeField(null=True, blank=True)
    agreed_scope = models.TextField(blank=True)
    agreed_deliverables = models.TextField(blank=True)
    agreed_working_hours = models.CharField(max_length=100, blank=True)
    agreed_tags_snapshot = models.JSONField(default=list, blank=True)
    snapshot_created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Deal snapshots"

    def __str__(self):
        return f"Snapshot of deal {self.deal.public_id}"


class CompletionConfirmation(models.Model):
    """Confirmation submitted by either party after a deal is completed."""

    deal = models.ForeignKey(
        Deal, on_delete=models.CASCADE, related_name="completions"
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    completed_on_time = models.BooleanField()
    compensation_received = models.BooleanField(default=True)
    compensation_fair = models.BooleanField(default=True)
    work_satisfactory = models.BooleanField(default=True)
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["deal", "submitted_by"]
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Confirmation for {self.deal.title} by {self.submitted_by.username}"

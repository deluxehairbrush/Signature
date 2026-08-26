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
    is_open_to_proposals = models.BooleanField(
        default=False,
        help_text="If true and no freelancer is assigned, this deal is listed "
        "publicly for freelancers to apply to.",
    )
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
    proof_hash = models.CharField(max_length=64, blank=True, db_index=True, help_text="SHA-256 hash of immutable deal terms, computed once at snapshot time.")
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


class DealMessage(models.Model):
    """A chat message scoped to a single deal, between its two participants."""

    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField(blank=True)
    attachment = models.FileField(upload_to="deal_attachments/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.username} on {self.deal.title}: {self.body[:40]}"


class DealDispute(models.Model):
    """A dispute raised on a deal, and (eventually) how it was resolved.

    One per deal — if it's reopened after resolution that's an edge case
    this scope doesn't handle.
    """

    class Outcome(models.TextChoices):
        REFUND_CLIENT = "REFUND_CLIENT", "Refund the client"
        PROCEED_AS_IS = "PROCEED_AS_IS", "Proceed with the work as-is"
        CANCEL_DEAL = "CANCEL_DEAL", "Cancel the deal"

    deal = models.OneToOneField(Deal, on_delete=models.CASCADE, related_name="dispute")
    raised_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="raised_disputes"
    )
    reason = models.TextField()
    is_resolved = models.BooleanField(default=False)
    outcome = models.CharField(max_length=20, choices=Outcome.choices, blank=True)
    resolution_notes = models.TextField(blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_disputes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        state = "resolved" if self.is_resolved else "open"
        return f"Dispute on {self.deal.title} ({state})"


class Notification(models.Model):
    """A notification for a deal-related event (status change, new message)."""

    class Verb(models.TextChoices):
        PROPOSED = "PROPOSED", "Deal proposed"
        ACCEPTED = "ACCEPTED", "Deal accepted"
        SIGNED = "SIGNED", "Deal signed"
        COMPLETED = "COMPLETED", "Deal completed"
        CANCELLED = "CANCELLED", "Deal cancelled"
        DISPUTED = "DISPUTED", "Deal disputed"
        DISPUTE_RESOLVED = "DISPUTE_RESOLVED", "Dispute resolved"
        APPLIED = "APPLIED", "Freelancer applied"
        MESSAGE = "MESSAGE", "New message"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="notifications")
    verb = models.CharField(max_length=20, choices=Verb.choices)
    message = models.CharField(max_length=300)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.verb} -> {self.recipient.username}: {self.message}"

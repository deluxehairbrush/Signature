from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ReputationRecord(models.Model):
    """Tracks individual reputation events for a user."""

    class EventType(models.TextChoices):
        DEAL_COMPLETED = "DEAL_COMPLETED", "Deal Completed"
        ON_TIME_COMPLETION = "ON_TIME_COMPLETION", "On-Time Completion"
        FAIR_COMPENSATION = "FAIR_COMPENSATION", "Fair Compensation"
        BOTH_CONFIRMED = "BOTH_CONFIRMED", "Both Parties Confirmed"
        DEAL_CANCELLED = "DEAL_CANCELLED", "Deal Cancelled"
        DISPUTE_RAISED = "DISPUTE_RAISED", "Dispute Raised"
        DISPUTE_RESOLVED = "DISPUTE_RESOLVED", "Dispute Resolved"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reputation_records",
    )
    deal = models.ForeignKey(
        "deals.Deal",
        on_delete=models.CASCADE,
        related_name="reputation_records",
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    score_delta = models.IntegerField(
        help_text="Change in score: positive for good, negative for bad",
        default=0,
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.event_type} ({self.score_delta:+d})"


class UserReputation(models.Model):
    """Cached reputation summary for a user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reputation",
    )
    score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    completed_deals = models.PositiveIntegerField(default=0)
    on_time_completions = models.PositiveIntegerField(default=0)
    fair_compensation_count = models.PositiveIntegerField(default=0)
    both_confirmed_count = models.PositiveIntegerField(default=0)
    cancelled_deals = models.PositiveIntegerField(default=0)
    disputes = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}: {self.score}/100"

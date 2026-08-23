from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """Audit trail for important events."""

    class EventType(models.TextChoices):
        USER_REGISTERED = "USER_REGISTERED", "User Registered"
        PROFILE_CREATED = "PROFILE_CREATED", "Profile Created"
        PROFILE_UPDATED = "PROFILE_UPDATED", "Profile Updated"
        DEAL_CREATED = "DEAL_CREATED", "Deal Created"
        DEAL_ACCEPTED = "DEAL_ACCEPTED", "Deal Accepted"
        DEAL_SIGNED = "DEAL_SIGNED", "Deal Signed"
        DEAL_ACTIVATED = "DEAL_ACTIVATED", "Deal Activated"
        DEAL_COMPLETED = "DEAL_COMPLETED", "Deal Completed"
        DEAL_CANCELLED = "DEAL_CANCELLED", "Deal Cancelled"
        DEAL_DISPUTED = "DEAL_DISPUTED", "Deal Disputed"
        COMPLETION_CONFIRMED = "COMPLETION_CONFIRMED", "Completion Confirmed"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_logs",
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    object_type = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.event_type} by {self.actor} at {self.timestamp}"

"""Audit logging service."""

from apps.audit.models import AuditLog


def log_event(
    event_type: str,
    actor=None,
    object_type: str = "",
    object_id: str = "",
    metadata: dict = None,
):
    """Record an audit event."""
    AuditLog.objects.create(
        event_type=event_type,
        actor=actor,
        object_type=object_type,
        object_id=str(object_id),
        metadata=metadata or {},
    )

"""Deal business logic: state machine, snapshots, proof generation."""

import hashlib
import json

from django.db import transaction
from django.utils import timezone as dj_timezone

from apps.deals.models import DealSnapshot


# Valid status transitions
VALID_TRANSITIONS = {
    "DRAFT": {"PROPOSED"},
    "PROPOSED": {"ACCEPTED", "CANCELLED"},
    # DISPUTED is reachable from ACCEPTED too — the frontend already offers
    # a "raise a dispute" action at that status (e.g. the freelancer never
    # started, or terms fell apart before work began), so the backend state
    # machine needs to allow what the UI already promises.
    "ACCEPTED": {"ACTIVE", "CANCELLED", "DISPUTED"},
    "ACTIVE": {"COMPLETED", "DISPUTED"},
    # ACTIVE is reachable from DISPUTED via a "proceed as-is" resolution
    # (see DealViewSet.resolve_dispute) — work resumes instead of the deal
    # just being force-cancelled or completed.
    "DISPUTED": {"COMPLETED", "CANCELLED", "ACTIVE"},
    "COMPLETED": set(),
    "CANCELLED": set(),
}


class InvalidTransition(Exception):
    def __init__(self, current_status, target_status):
        self.current_status = current_status
        self.target_status = target_status
        super().__init__(
            f"Cannot transition from {current_status} to {target_status}"
        )


def validate_transition(current_status: str, target_status: str):
    """Raise InvalidTransition if the move is not allowed."""
    allowed = VALID_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        raise InvalidTransition(current_status, target_status)


def transition_deal(deal, target_status: str):
    """Atomically transition a deal to a new status."""
    with transaction.atomic():
        deal.refresh_from_db()
        validate_transition(deal.status, target_status)
        deal.status = target_status

        now = dj_timezone.now()
        if target_status == "ACTIVE" and deal.started_at is None:
            deal.started_at = now
        if target_status == "COMPLETED":
            deal.completed_at = now

        deal.save(update_fields=["status", "started_at", "completed_at", "updated_at"])
    return deal


def _compute_proof_hash(deal) -> str:
    """Compute a deterministic SHA-256 proof hash from immutable deal terms only.

    No timestamp is included — the same deal data always produces the same hash.
    """
    canonical = json.dumps(
        {
            "deal_id": str(deal.public_id),
            "client": deal.client.username,
            "freelancer": deal.freelancer.username if deal.freelancer else "",
            "compensation": str(deal.compensation_amount),
            "currency": deal.currency,
            "scope": deal.scope,
            "deliverables": deal.deliverables,
            "deadline": deal.deadline.isoformat() if deal.deadline else "",
            "working_hours": deal.working_hours,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def create_deal_snapshot(deal) -> DealSnapshot:
    """Create an immutable snapshot of the deal's current terms and compute
    the proof hash once.  The hash is stored on the snapshot so it never
    changes — every subsequent GET /proof/ returns the same value.
    """
    from apps.profiles.models import FreelancerProfile

    freelancer_name = ""
    freelancer_username = deal.freelancer.username if deal.freelancer else ""
    if deal.freelancer:
        try:
            fp = FreelancerProfile.objects.get(user=deal.freelancer)
            freelancer_name = fp.display_name or deal.freelancer.full_name
        except FreelancerProfile.DoesNotExist:
            freelancer_name = deal.freelancer.full_name

    client_name = deal.client.full_name or deal.client.username
    client_username = deal.client.username
    tag_names = list(deal.tags.values_list("name", flat=True))

    proof_hash = _compute_proof_hash(deal)

    snapshot, _ = DealSnapshot.objects.get_or_create(
        deal=deal,
        defaults={
            "freelancer_name_at_agreement": freelancer_name,
            "client_name_at_agreement": client_name,
            "freelancer_username_at_agreement": freelancer_username,
            "client_username_at_agreement": client_username,
            "agreed_compensation": deal.compensation_amount,
            "agreed_currency": deal.currency,
            "agreed_deadline": deal.deadline,
            "agreed_scope": deal.scope,
            "agreed_deliverables": deal.deliverables,
            "agreed_working_hours": deal.working_hours,
            "agreed_tags_snapshot": tag_names,
        },
    )

    # Store the proof hash on the snapshot so it is stable forever
    if not snapshot.proof_hash:
        snapshot.proof_hash = proof_hash
        snapshot.save(update_fields=["proof_hash"])

    return snapshot


def build_proof_response(deal):
    """Build public proof-of-record response for a completed deal."""
    from apps.signatures.models import DealSignature

    signatures = DealSignature.objects.filter(deal=deal)
    sig_map = {s.signer_role: s for s in signatures}
    completions = deal.completions.all()

    # Prefer the stored snapshot hash; fall back to computing (for deals
    # created before snapshots existed — shouldn't happen in practice).
    snapshot = getattr(deal, "snapshot", None)
    proof_hash = snapshot.proof_hash if snapshot and snapshot.proof_hash else _compute_proof_hash(deal)

    return {
        "proof_id": str(deal.public_id),
        "deal_id": str(deal.public_id),
        "project": deal.title,
        "freelancer": deal.freelancer.username if deal.freelancer else "N/A",
        "client": deal.client.username,
        "status": deal.status,
        "agreed_compensation": (
            f"{deal.compensation_amount} {deal.currency}"
            if deal.compensation_amount
            else "Not specified"
        ),
        "deadline": deal.deadline.isoformat() if deal.deadline else None,
        "completed_at": deal.completed_at.isoformat() if deal.completed_at else None,
        "signatures": {
            "freelancer": "FREELANCER" in sig_map,
            "client": "CLIENT" in sig_map,
        },
        "completion": {
            "on_time": any(c.completed_on_time for c in completions),
            "fair_compensation": any(c.compensation_fair for c in completions),
        },
        "proof_hash": proof_hash,
    }

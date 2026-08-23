"""Reputation calculation service — deterministic, backend-only."""

from django.db import transaction

from apps.profiles.models import FreelancerProfile
from apps.reputation.models import ReputationRecord, UserReputation


# ---------------------------------------------------------------------------
# Scoring weights
# ---------------------------------------------------------------------------
BASE_SCORE = 50
MAX_SCORE = 100
MIN_SCORE = 0

# Positive point values
POINTS_COMPLETED = 10
POINTS_ON_TIME = 5
POINTS_FAIR_COMPENSATION = 5
POINTS_BOTH_CONFIRMED = 8

# Negative point values
POINTS_CANCELLED = -8
POINTS_DISPUTE = -12


def _clamp(value: int, low: int = MIN_SCORE, high: int = MAX_SCORE) -> int:
    return max(low, min(high, value))


def recalculate_reputation(deal) -> int:
    """
    Recalculate a user's reputation after a deal state change.
    Returns the new score for the relevant user.
    """
    users_affected = set()
    if deal.client:
        users_affected.add(deal.client)
    if deal.freelancer:
        users_affected.add(deal.freelancer)

    for user in users_affected:
        with transaction.atomic():
            rep, _ = UserReputation.objects.select_for_update().get_or_create(user=user)
            _rebuild_from_records(rep)
            rep.save()
            # Also update profile
            _sync_profile(user, rep)

    return _get_user_score(deal.freelancer) if deal.freelancer else 0


def _rebuild_from_records(rep: UserReputation):
    """Rebuild reputation from all historical records for the user."""
    records = ReputationRecord.objects.filter(user=rep.user)

    rep.score = BASE_SCORE
    rep.completed_deals = 0
    rep.on_time_completions = 0
    rep.fair_compensation_count = 0
    rep.both_confirmed_count = 0
    rep.cancelled_deals = 0
    rep.disputes = 0

    for record in records:
        rep.score += record.score_delta
        if record.event_type == ReputationRecord.EventType.DEAL_COMPLETED:
            rep.completed_deals += 1
        elif record.event_type == ReputationRecord.EventType.ON_TIME_COMPLETION:
            rep.on_time_completions += 1
        elif record.event_type == ReputationRecord.EventType.FAIR_COMPENSATION:
            rep.fair_compensation_count += 1
        elif record.event_type == ReputationRecord.EventType.BOTH_CONFIRMED:
            rep.both_confirmed_count += 1
        elif record.event_type == ReputationRecord.EventType.DEAL_CANCELLED:
            rep.cancelled_deals += 1
        elif record.event_type == ReputationRecord.EventType.DISPUTE_RAISED:
            rep.disputes += 1

    rep.score = _clamp(rep.score)


def _sync_profile(user, rep: UserReputation):
    """Sync reputation data to the freelancer profile."""
    import logging
    logger = logging.getLogger(__name__)
    try:
        fp = user.freelancer_profile
        fp.reputation_score = rep.score
        fp.completed_deals = rep.completed_deals
        fp.successful_deals = rep.completed_deals - rep.disputes
        fp.save(update_fields=["reputation_score", "completed_deals", "successful_deals", "updated_at"])
    except FreelancerProfile.DoesNotExist:
        pass  # User is not a freelancer — nothing to sync
    except Exception:
        logger.warning("Failed to sync reputation to profile for user %s", user.pk, exc_info=True)


def _get_user_score(user):
    try:
        return user.reputation.score
    except UserReputation.DoesNotExist:
        return BASE_SCORE


# ---------------------------------------------------------------------------
# Recording events
# ---------------------------------------------------------------------------

def record_event(user, deal, event_type: str, score_delta: int, metadata: dict = None):
    """Record a single reputation event."""
    ReputationRecord.objects.create(
        user=user,
        deal=deal,
        event_type=event_type,
        score_delta=score_delta,
        metadata=metadata or {},
    )


def process_deal_completion(deal):
    """Process all reputation events when a deal is marked COMPLETED.

    Idempotent: skips if a DEAL_COMPLETED record already exists for this deal+user.
    """
    completions = deal.completions.all()
    both_confirmed = completions.count() >= 2

    for user in [deal.client, deal.freelancer]:
        if user is None:
            continue

        # Idempotency guard — don't double-count
        if ReputationRecord.objects.filter(
            user=user, deal=deal, event_type=ReputationRecord.EventType.DEAL_COMPLETED
        ).exists():
            continue

        # Deal completed
        record_event(user, deal, ReputationRecord.EventType.DEAL_COMPLETED, POINTS_COMPLETED)

        # Check completion confirmations
        user_confirmed = completions.filter(submitted_by=user).first()

        if user_confirmed:
            if user_confirmed.completed_on_time:
                record_event(user, deal, ReputationRecord.EventType.ON_TIME_COMPLETION, POINTS_ON_TIME)

            if user_confirmed.compensation_fair:
                record_event(user, deal, ReputationRecord.EventType.FAIR_COMPENSATION, POINTS_FAIR_COMPENSATION)

        if both_confirmed:
            record_event(user, deal, ReputationRecord.EventType.BOTH_CONFIRMED, POINTS_BOTH_CONFIRMED)


def process_deal_cancellation(deal):
    """Process reputation events when a deal is cancelled.

    Idempotent: skips if a DEAL_CANCELLED record already exists for this deal+user.
    """
    for user in [deal.client, deal.freelancer]:
        if user and not ReputationRecord.objects.filter(
            user=user, deal=deal, event_type=ReputationRecord.EventType.DEAL_CANCELLED
        ).exists():
            record_event(user, deal, ReputationRecord.EventType.DEAL_CANCELLED, POINTS_CANCELLED)


def process_deal_dispute(deal):
    """Process reputation events when a deal is disputed.

    Idempotent: skips if a DISPUTE_RAISED record already exists for this deal+user.
    """
    for user in [deal.client, deal.freelancer]:
        if user and not ReputationRecord.objects.filter(
            user=user, deal=deal, event_type=ReputationRecord.EventType.DISPUTE_RAISED
        ).exists():
            record_event(user, deal, ReputationRecord.EventType.DISPUTE_RAISED, POINTS_DISPUTE)

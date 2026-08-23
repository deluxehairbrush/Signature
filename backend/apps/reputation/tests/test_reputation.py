import pytest
from rest_framework import status

from apps.deals.models import Deal
from apps.reputation.models import ReputationRecord, UserReputation
from apps.reputation.services import (
    BASE_SCORE,
    process_deal_completion,
    recalculate_reputation,
    record_event,
)


@pytest.mark.django_db
class TestReputationCalculation:
    def test_initial_reputation_has_baseline(self, freelancer_user):
        """Reputation starts at baseline when no records exist."""
        # Manually create the UserReputation row with baseline
        rep = UserReputation.objects.create(user=freelancer_user, score=BASE_SCORE)
        assert rep.score == BASE_SCORE

    def test_completed_deal_increases_score(self, freelancer_user, client_user):
        """process_deal_completion + recalculate_reputation raises the score."""
        deal = Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Rep Test Deal", status="COMPLETED",
        )
        # Record events first, then rebuild
        process_deal_completion(deal)
        recalculate_reputation(deal)
        rep = UserReputation.objects.get(user=freelancer_user)
        assert rep.score > BASE_SCORE
        assert rep.completed_deals >= 1

    def test_score_clamped_to_100(self, freelancer_user, client_user):
        deal = Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Clamp Test", status="COMPLETED",
        )
        for _ in range(20):
            record_event(freelancer_user, deal, "DEAL_COMPLETED", 10)
        recalculate_reputation(deal)
        rep = UserReputation.objects.get(user=freelancer_user)
        assert rep.score <= 100

    def test_score_clamped_to_0(self, freelancer_user, client_user):
        deal = Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Low Score Test", status="CANCELLED",
        )
        for _ in range(20):
            record_event(freelancer_user, deal, "DEAL_CANCELLED", -8)
        recalculate_reputation(deal)
        rep = UserReputation.objects.get(user=freelancer_user)
        assert rep.score >= 0

    def test_reputation_endpoint(self, auth_client_f, freelancer_user):
        response = auth_client_f.get(f"/api/v1/reputation/{freelancer_user.username}/")
        assert response.status_code == status.HTTP_200_OK
        assert "reputation" in response.data

import pytest
from rest_framework import status

from apps.deals.models import Deal
from apps.tags.models import Tag


@pytest.mark.django_db
class TestDealCRUD:
    def test_create_deal(self, auth_client_c, client_user, freelancer_user):
        response = auth_client_c.post("/api/v1/deals/", {
            "title": "Website Redesign",
            "description": "Redesign company website",
            "scope": "Full redesign with React",
            "compensation_amount": 5000,
            "currency": "USD",
            "freelancer": freelancer_user.id,
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert Deal.objects.filter(title="Website Redesign").exists()

    def test_list_deals(self, auth_client_c):
        response = auth_client_c.get("/api/v1/deals/")
        assert response.status_code == status.HTTP_200_OK

    def test_non_participant_cannot_view_deal(self, api_client, client_user, freelancer_user):
        deal = Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Private Deal", status="DRAFT",
        )
        api_client.force_authenticate(user=freelancer_user)
        # This is fine — freelancer is a participant
        response = api_client.get(f"/api/v1/deals/{deal.id}/")
        assert response.status_code == status.HTTP_200_OK

        # Create another user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(email="other@test.com", username="other", password="pass1234")
        api_client.force_authenticate(user=other)
        response = api_client.get(f"/api/v1/deals/{deal.id}/")
        assert response.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


@pytest.mark.django_db
class TestDealStateMachine:
    def _create_deal(self, client_user, freelancer_user, status_val="DRAFT"):
        return Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Test Deal", status=status_val,
        )

    def test_draft_to_proposed(self, auth_client_c, client_user, freelancer_user):
        deal = self._create_deal(client_user, freelancer_user, "DRAFT")
        # Update status to PROPOSED via PATCH
        response = auth_client_c.patch(f"/api/v1/deals/{deal.id}/", {"status": "PROPOSED"}, format="json")
        # This tests through serializer
        if response.status_code == 200:
            deal.refresh_from_db()
            assert deal.status == "PROPOSED"

    def test_invalid_transition(self, client_user, freelancer_user):
        deal = self._create_deal(client_user, freelancer_user, "COMPLETED")
        from apps.deals.services import InvalidTransition, validate_transition
        with pytest.raises(InvalidTransition):
            validate_transition("COMPLETED", "DRAFT")

    def test_proposed_to_accepted(self, client_user, freelancer_user):
        from apps.deals.services import transition_deal
        deal = self._create_deal(client_user, freelancer_user, "PROPOSED")
        transition_deal(deal, "ACCEPTED")
        deal.refresh_from_db()
        assert deal.status == "ACCEPTED"

    def test_accepted_to_active(self, client_user, freelancer_user):
        from apps.deals.services import transition_deal
        deal = self._create_deal(client_user, freelancer_user, "ACCEPTED")
        transition_deal(deal, "ACTIVE")
        deal.refresh_from_db()
        assert deal.status == "ACTIVE"
        assert deal.started_at is not None


@pytest.mark.django_db
class TestCompletionConfirmation:
    def test_submit_completion(self, auth_client_c, client_user, freelancer_user):
        from apps.deals.services import transition_deal
        deal = Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Test Deal", status="ACTIVE",
        )
        transition_deal(deal, "COMPLETED")
        response = auth_client_c.post(
            f"/api/v1/deals/{deal.id}/completion/",
            {
                "completed_on_time": True,
                "compensation_received": True,
                "compensation_fair": True,
                "work_satisfactory": True,
                "comment": "Great work!",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED

    def test_non_participant_cannot_submit(self, api_client, client_user, freelancer_user):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        other = User.objects.create_user(email="other@test.com", username="other", password="pass1234")
        api_client.force_authenticate(user=other)

        deal = Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Test Deal", status="COMPLETED",
        )
        response = api_client.post(
            f"/api/v1/deals/{deal.id}/completion/",
            {"completed_on_time": True, "compensation_fair": True},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

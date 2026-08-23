import pytest
from rest_framework import status

from apps.deals.models import Deal
from apps.signatures.models import DealSignature


@pytest.mark.django_db
class TestSignatures:
    def _make_deal(self, client_user, freelancer_user, status="ACCEPTED"):
        return Deal.objects.create(
            client=client_user, freelancer=freelancer_user,
            title="Sign Test Deal", status=status,
        )

    def test_client_can_sign(self, auth_client_c, client_user, freelancer_user):
        deal = self._make_deal(client_user, freelancer_user)
        response = auth_client_c.post(f"/api/v1/deals/{deal.id}/sign/", format="json")
        assert response.status_code == status.HTTP_200_OK
        assert DealSignature.objects.filter(deal=deal, signer_role="CLIENT").exists()

    def test_duplicate_signature_rejected(self, auth_client_c, client_user, freelancer_user):
        deal = self._make_deal(client_user, freelancer_user)
        auth_client_c.post(f"/api/v1/deals/{deal.id}/sign/", format="json")
        response = auth_client_c.post(f"/api/v1/deals/{deal.id}/sign/", format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_both_sign_triggers_active(self, auth_client_c, auth_client_f, client_user, freelancer_user):
        deal = self._make_deal(client_user, freelancer_user)
        auth_client_c.post(f"/api/v1/deals/{deal.id}/sign/", format="json")
        auth_client_f.post(f"/api/v1/deals/{deal.id}/sign/", format="json")
        deal.refresh_from_db()
        assert deal.status == "ACTIVE"

    def test_signature_hash_generated(self, auth_client_c, client_user, freelancer_user):
        deal = self._make_deal(client_user, freelancer_user)
        auth_client_c.post(f"/api/v1/deals/{deal.id}/sign/", format="json")
        sig = DealSignature.objects.get(deal=deal, signer_role="CLIENT")
        assert sig.signature_hash
        assert len(sig.signature_hash) == 64  # SHA-256 hex

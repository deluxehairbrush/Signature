"""Signature business logic."""

import hashlib
import json
from datetime import datetime, timezone

from django.db import transaction

from apps.deals.models import Deal
from apps.deals.services import create_deal_snapshot, transition_deal


def _get_signer_role(deal: Deal, user) -> str:
    if user == deal.client:
        return "CLIENT"
    if user == deal.freelancer:
        return "FREELANCER"
    raise ValueError("User is not a participant of this deal.")


def _generate_signature_hash(deal: Deal) -> str:
    canonical = json.dumps(
        {
            "deal_id": str(deal.public_id),
            "client": deal.client.username,
            "freelancer": deal.freelancer.username if deal.freelancer else "",
            "compensation": str(deal.compensation_amount),
            "scope": deal.scope,
            "deliverables": deal.deliverables,
            "deadline": deal.deadline.isoformat() if deal.deadline else "",
            "signed_at": datetime.now(timezone.utc).isoformat(),
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def sign_deal(deal: Deal, user, request=None):
    """
    Sign a deal. Both parties must sign before it transitions to ACTIVE.
    """
    from apps.signatures.models import DealSignature

    with transaction.atomic():
        deal.refresh_from_db()

        if deal.status not in ("ACCEPTED", "ACTIVE"):
            raise ValueError(f"Deal must be accepted before signing. Current status: {deal.status}")

        role = _get_signer_role(deal, user)

        if DealSignature.objects.filter(deal=deal, signer_role=role, status="VALID").exists():
            raise ValueError(f"{role} has already signed this deal.")

        ip_address = None
        user_agent = ""
        if request:
            ip_address = (
                request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
                or request.META.get("REMOTE_ADDR")
            )
            user_agent = request.META.get("HTTP_USER_AGENT", "")

        signature = DealSignature.objects.create(
            deal=deal,
            signer=user,
            signer_role=role,
            signature_hash=_generate_signature_hash(deal),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Check if both parties have signed
        both_signed = DealSignature.objects.filter(
            deal=deal, status="VALID"
        ).count() >= 2

        if both_signed and deal.status == "ACCEPTED":
            create_deal_snapshot(deal)
            transition_deal(deal, "ACTIVE")

        return signature

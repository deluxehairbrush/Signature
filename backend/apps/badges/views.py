import json

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from rest_framework import permissions
from rest_framework.views import APIView

from apps.reputation.models import UserReputation

User = get_user_model()


def _get_badge_color(score: int, deal_count: int) -> str:
    if deal_count == 0:
        return "#9CA3AF"
    if score >= 70:
        return "#10B981"
    if score >= 40:
        return "#F59E0B"
    return "#9CA3AF"


def _generate_svg(label: str, score_text: str, deal_count: int, color: str) -> str:
    width = 200
    height = 30
    label_width = 80
    score_width = width - label_width

    deals_text = ""
    if deal_count > 0:
        plural = "s" if deal_count > 1 else ""
        deals_text = f'<text x="{label_width + score_width / 2}" y="{height - 4}" text-anchor="middle" style="font:400 10px sans-serif;fill:#fff">{deal_count} deal{plural}</text>'

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">
  <rect x="0" y="0" width="{label_width}" height="{height}" fill="#555"/>
  <text x="{label_width / 2}" y="{height / 2 + 4}" text-anchor="middle" style="font:600 12px sans-serif;fill:#fff">{label}</text>
  <rect x="{label_width}" y="0" width="{score_width}" height="{height}" fill="{color}"/>
  <text x="{label_width + score_width / 2}" y="{height / 2 + 4}" text-anchor="middle" style="font:600 12px sans-serif;fill:#fff">{score_text}</text>
  {deals_text}
</svg>'''


def _get_or_default_rep(username):
    """Return (user, reputation) or (None, None) if user not found.
    Uses filter().first() to avoid creating rows on unauthenticated reads.
    """
    user = User.objects.filter(username=username).first()
    if user is None:
        return None, None
    rep = UserReputation.objects.filter(user=user).first()
    return user, rep


class BadgeView(APIView):
    """GET /api/v1/badges/{username}/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user, rep = _get_or_default_rep(username)
        if user is None:
            # Return a "no data" badge even for unknown usernames
            svg = _generate_svg("TrustGig", "no data", 0, "#9CA3AF")
        elif rep is None or rep.completed_deals == 0:
            svg = _generate_svg("TrustGig", "no data", 0, "#9CA3AF")
        else:
            score_text = f"{rep.score}/100"
            color = _get_badge_color(rep.score, rep.completed_deals)
            svg = _generate_svg("TrustGig", score_text, rep.completed_deals, color)

        return HttpResponse(svg, content_type="image/svg+xml", headers={
            "Cache-Control": "public, max-age=300, s-maxage=600",
            "Access-Control-Allow-Origin": "*",
        })


class BadgeJSONView(APIView):
    """GET /api/v1/badges/{username}/json/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user, rep = _get_or_default_rep(username)

        data = {
            "success": True,
            "username": username,
            "score": rep.score if rep else 0,
            "completed_deals": rep.completed_deals if rep else 0,
            "on_time_completions": rep.on_time_completions if rep else 0,
            "fair_compensation_count": rep.fair_compensation_count if rep else 0,
            "color": _get_badge_color(rep.score, rep.completed_deals) if rep else "#9CA3AF",
        }

        return HttpResponse(json.dumps(data), content_type="application/json")

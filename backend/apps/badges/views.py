import json

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
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


class BadgeView(APIView):
    """GET /api/v1/badges/{username}/"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, username):
        user = get_object_or_404(User, username=username)
        rep, _ = UserReputation.objects.get_or_create(user=user)

        if rep.completed_deals == 0:
            score_text = "no data"
            color = "#9CA3AF"
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
        user = get_object_or_404(User, username=username)
        rep, _ = UserReputation.objects.get_or_create(user=user)

        data = json.dumps({
            "success": True,
            "username": username,
            "score": rep.score,
            "completed_deals": rep.completed_deals,
            "on_time_completions": rep.on_time_completions,
            "fair_compensation_count": rep.fair_compensation_count,
            "color": _get_badge_color(rep.score, rep.completed_deals),
        })

        return HttpResponse(data, content_type="application/json")

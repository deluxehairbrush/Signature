from unittest.mock import patch, MagicMock

import pytest
from rest_framework import status

from apps.ai_integration.services import AIServiceError, summarize_deal, detect_red_flags


@pytest.mark.django_db
class TestAIService:
    @patch("apps.ai_integration.services.requests.post")
    def test_summarize_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "ok": True,
            "deal": {
                "freelancerName": "Alice",
                "clientName": "Bob",
                "scope": "Build a website",
                "price": 5000,
                "currency": "USD",
                "deadline": "2026-09-01",
                "paymentTerms": "50% upfront",
                "revisions": "2 included",
                "confidence": "high",
                "missingFields": [],
            },
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = summarize_deal("I need a website for $5000")
        assert result["scope"] == "Build a website"
        assert result["price"] == 5000
        assert result["confidence"] == "high"

    @patch("apps.ai_integration.services.requests.post")
    def test_summarize_timeout(self, mock_post):
        import requests
        mock_post.side_effect = requests.Timeout()
        with pytest.raises(AIServiceError) as exc_info:
            summarize_deal("Some text")
        assert exc_info.value.status_code == 408

    @patch("apps.ai_integration.services.requests.post")
    def test_summarize_service_unavailable(self, mock_post):
        import requests
        mock_post.side_effect = requests.ConnectionError()
        with pytest.raises(AIServiceError) as exc_info:
            summarize_deal("Some text")
        assert exc_info.value.status_code == 502

    @patch("apps.ai_integration.services.requests.post")
    def test_red_flags_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "ok": True,
            "result": {
                "hasRedFlags": True,
                "flags": [{"field": "price", "issue": "Missing price"}],
            },
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = detect_red_flags({"scope": "Build website", "confidence": "low"})
        assert result["has_red_flags"] is True
        assert len(result["flags"]) == 1


@pytest.mark.django_db
class TestAIEndpoints:
    def test_summarize_requires_auth(self, api_client):
        response = api_client.post("/api/v1/ai/summarize-deal/", {"raw_text": "test"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_red_flags_requires_auth(self, api_client):
        response = api_client.post("/api/v1/ai/red-flags/", {"scope": "test", "confidence": "high"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

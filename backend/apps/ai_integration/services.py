"""AI integration service — proxies requests to the existing AI service."""

import logging
import os
import requests
from rest_framework import serializers

logger = logging.getLogger(__name__)

AI_BASE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:3000")
AI_TIMEOUT = 30  # seconds


class AISummaryResponseSerializer(serializers.Serializer):
    freelancerName = serializers.CharField(allow_null=True, required=False)
    clientName = serializers.CharField(allow_null=True, required=False)
    scope = serializers.CharField()
    price = serializers.FloatField(allow_null=True, required=False)
    currency = serializers.CharField(default="INR")
    deadline = serializers.CharField(allow_null=True, required=False)
    paymentTerms = serializers.CharField(allow_null=True, required=False)
    revisions = serializers.CharField(allow_null=True, required=False)
    confidence = serializers.ChoiceField(choices=["high", "medium", "low"])
    missingFields = serializers.ListField(child=serializers.CharField())


class AIRedFlagsResponseSerializer(serializers.Serializer):
    hasRedFlags = serializers.BooleanField()
    flags = serializers.ListField(
        child=serializers.DictField()
    )


class AIServiceError(Exception):
    def __init__(self, message, status_code=None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def summarize_deal(raw_text: str) -> dict:
    """
    Send chat text to the existing AI service for contract extraction.
    Returns validated deal summary data.
    """
    try:
        response = requests.post(
            f"{AI_BASE_URL}/api/ai/summarize",
            json={"rawText": raw_text},
            timeout=AI_TIMEOUT,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 429:
            raise AIServiceError("AI service is rate-limited. Please try again later.", 429)

        if response.status_code >= 500:
            raise AIServiceError("AI service is unavailable.", 502)

        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            raise AIServiceError(
                data.get("error", "AI service returned an error."),
                status_code=502,
            )

        deal = data.get("deal", {})
        serializer = AISummaryResponseSerializer(data=deal)
        if not serializer.is_valid():
            raise AIServiceError(
                f"AI response validation failed: {serializer.errors}",
                status_code=502,
            )

        return serializer.validated_data

    except requests.Timeout:
        raise AIServiceError("AI service timed out.", 408)
    except requests.ConnectionError:
        raise AIServiceError("Could not connect to AI service.", 502)
    except AIServiceError:
        raise
    except Exception as e:
        logger.exception("Unexpected AI service error")
        raise AIServiceError(f"AI service error: {str(e)}", 502)


def detect_red_flags(deal_data: dict) -> dict:
    """
    Send deal summary to the AI service for red flag detection.
    """
    try:
        response = requests.post(
            f"{AI_BASE_URL}/api/ai/redflags",
            json={"deal": deal_data},
            timeout=AI_TIMEOUT,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 429:
            raise AIServiceError("AI service is rate-limited.", 429)

        if response.status_code >= 500:
            raise AIServiceError("AI service is unavailable.", 502)

        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            raise AIServiceError(
                data.get("error", "AI service returned an error."), 502
            )

        result = data.get("result", data)
        serializer = AIRedFlagsResponseSerializer(data=result)
        if not serializer.is_valid():
            raise AIServiceError(
                f"AI red flags response validation failed: {serializer.errors}", 502
            )

        return serializer.validated_data

    except requests.Timeout:
        raise AIServiceError("AI service timed out.", 408)
    except requests.ConnectionError:
        raise AIServiceError("Could not connect to AI service.", 502)
    except AIServiceError:
        raise
    except Exception as e:
        logger.exception("Unexpected AI service error")
        raise AIServiceError(f"AI service error: {str(e)}", 502)

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import OpenApiExample, extend_schema

from .serializers import (
    AIRedFlagsRequestSerializer,
    AIRedFlagsResponseSerializer,
    AISummarizeRequestSerializer,
    AISummaryResponseSerializer,
)
from .services import AIServiceError, detect_red_flags, summarize_deal


class AISummarizeView(APIView):
    """POST /api/v1/ai/summarize-deal/"""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "ai"

    @extend_schema(
        summary="Summarize a deal from raw text",
        description=(
            "Sends a chat transcript or OCR text to the AI service and returns "
            "a structured deal summary with extracted fields like scope, price, "
            "deadline, and confidence level."
        ),
        request=AISummarizeRequestSerializer,
        responses={
            200: AISummaryResponseSerializer,
            400: {"description": "Invalid request body"},
            502: {"description": "AI service error or unavailable"},
        },
        examples=[
            OpenApiExample(
                "Successful summarization",
                value={"raw_text": "I'll build your website for $3000, deadline Dec 15"},
                request_only=True,
            ),
        ],
        tags=["AI"],
    )
    def post(self, request):
        serializer = AISummarizeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = summarize_deal(serializer.validated_data["raw_text"])
        except AIServiceError as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "AI_SERVICE_ERROR", "message": e.message},
                },
                status=e.status_code or status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"success": True, "deal": result})


class AIRedFlagsView(APIView):
    """POST /api/v1/ai/red-flags/"""

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "ai"

    @extend_schema(
        summary="Detect red flags in a deal",
        description=(
            "Analyzes structured deal data for potential red flags such as "
            "missing price, vague scope, missing payment terms, or unrealistic "
            "deadlines."
        ),
        request=AIRedFlagsRequestSerializer,
        responses={
            200: AIRedFlagsResponseSerializer,
            400: {"description": "Invalid request body"},
            502: {"description": "AI service error or unavailable"},
        },
        examples=[
            OpenApiExample(
                "Analyze deal for red flags",
                value={
                    "scope": "Build a landing page",
                    "price": 500,
                    "currency": "USD",
                    "deadline": "tomorrow",
                    "confidence": "low",
                    "missing_fields": ["payment_terms", "revisions"],
                },
                request_only=True,
            ),
        ],
        tags=["AI"],
    )
    def post(self, request):
        serializer = AIRedFlagsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Map snake_case to camelCase for the existing AI service
        deal_data = {
            "freelancerName": serializer.validated_data.get("freelancer_name"),
            "clientName": serializer.validated_data.get("client_name"),
            "scope": serializer.validated_data["scope"],
            "price": serializer.validated_data.get("price"),
            "currency": serializer.validated_data.get("currency", "INR"),
            "deadline": serializer.validated_data.get("deadline"),
            "paymentTerms": serializer.validated_data.get("payment_terms"),
            "revisions": serializer.validated_data.get("revisions"),
            "confidence": serializer.validated_data["confidence"],
            "missingFields": serializer.validated_data.get("missing_fields", []),
        }

        try:
            result = detect_red_flags(deal_data)
        except AIServiceError as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "AI_SERVICE_ERROR", "message": e.message},
                },
                status=e.status_code or status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"success": True, "result": result})

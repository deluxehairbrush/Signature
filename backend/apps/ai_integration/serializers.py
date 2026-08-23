from rest_framework import serializers


class AISummarizeRequestSerializer(serializers.Serializer):
    raw_text = serializers.CharField(min_length=1, max_length=50000)


class AIRedFlagsRequestSerializer(serializers.Serializer):
    freelancer_name = serializers.CharField(allow_null=True, required=False)
    client_name = serializers.CharField(allow_null=True, required=False)
    scope = serializers.CharField()
    price = serializers.FloatField(allow_null=True, required=False)
    currency = serializers.CharField(default="INR")
    deadline = serializers.CharField(allow_null=True, required=False)
    payment_terms = serializers.CharField(allow_null=True, required=False)
    revisions = serializers.CharField(allow_null=True, required=False)
    confidence = serializers.ChoiceField(choices=["high", "medium", "low"])
    missing_fields = serializers.ListField(child=serializers.CharField())


class AISummaryResponseSerializer(serializers.Serializer):
    freelancer_name = serializers.CharField(allow_null=True)
    client_name = serializers.CharField(allow_null=True)
    scope = serializers.CharField()
    price = serializers.FloatField(allow_null=True)
    currency = serializers.CharField()
    deadline = serializers.CharField(allow_null=True)
    payment_terms = serializers.CharField(allow_null=True)
    revisions = serializers.CharField(allow_null=True)
    confidence = serializers.ChoiceField(choices=["high", "medium", "low"])
    missing_fields = serializers.ListField(child=serializers.CharField())


class AIRedFlagsResponseSerializer(serializers.Serializer):
    has_red_flags = serializers.BooleanField()
    flags = serializers.ListField(child=serializers.DictField())

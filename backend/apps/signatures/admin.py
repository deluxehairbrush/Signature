from django.contrib import admin
from .models import DealSignature


@admin.register(DealSignature)
class DealSignatureAdmin(admin.ModelAdmin):
    list_display = ["deal", "signer", "signer_role", "status", "signed_at"]
    list_filter = ["signer_role", "status"]
    search_fields = ["deal__title", "signer__username", "signature_hash"]
    readonly_fields = ["signed_at", "signature_hash"]

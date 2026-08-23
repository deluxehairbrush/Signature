from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["event_type", "actor", "object_type", "object_id", "timestamp"]
    list_filter = ["event_type"]
    search_fields = ["actor__username", "object_type", "object_id"]
    readonly_fields = ["timestamp"]

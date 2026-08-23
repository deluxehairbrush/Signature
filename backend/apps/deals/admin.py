from django.contrib import admin
from .models import CompletionConfirmation, Deal, DealSnapshot


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ["title", "client", "freelancer", "status", "compensation_amount", "deadline", "created_at"]
    list_filter = ["status", "currency"]
    search_fields = ["title", "description", "client__username", "freelancer__username"]
    readonly_fields = ["public_id", "created_at", "updated_at", "started_at", "completed_at"]
    filter_horizontal = ["tags"]


@admin.register(DealSnapshot)
class DealSnapshotAdmin(admin.ModelAdmin):
    list_display = ["deal", "freelancer_name_at_agreement", "client_name_at_agreement", "agreed_compensation", "snapshot_created_at"]
    readonly_fields = [f.name for f in DealSnapshot._meta.get_fields()]


@admin.register(CompletionConfirmation)
class CompletionConfirmationAdmin(admin.ModelAdmin):
    list_display = ["deal", "submitted_by", "completed_on_time", "compensation_fair", "submitted_at"]
    list_filter = ["completed_on_time", "compensation_fair", "work_satisfactory"]

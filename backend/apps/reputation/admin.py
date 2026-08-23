from django.contrib import admin
from .models import ReputationRecord, UserReputation


@admin.register(ReputationRecord)
class ReputationRecordAdmin(admin.ModelAdmin):
    list_display = ["user", "deal", "event_type", "score_delta", "created_at"]
    list_filter = ["event_type"]
    search_fields = ["user__username", "deal__title"]
    readonly_fields = ["created_at"]


@admin.register(UserReputation)
class UserReputationAdmin(admin.ModelAdmin):
    list_display = ["user", "score", "completed_deals", "cancelled_deals", "disputes", "updated_at"]
    search_fields = ["user__username"]
    readonly_fields = ["score", "completed_deals", "on_time_completions",
                       "fair_compensation_count", "both_confirmed_count",
                       "cancelled_deals", "disputes"]

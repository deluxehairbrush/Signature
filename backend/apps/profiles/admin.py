from django.contrib import admin
from .models import ClientProfile, FreelancerProfile, SocialLink


@admin.register(FreelancerProfile)
class FreelancerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "display_name", "availability_status", "reputation_score", "completed_deals"]
    list_filter = ["availability_status"]
    search_fields = ["user__username", "display_name", "headline", "bio"]
    readonly_fields = ["reputation_score", "completed_deals", "successful_deals"]
    filter_horizontal = ["tags"]


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "company_name", "industry", "location"]
    list_filter = ["industry"]
    search_fields = ["user__username", "company_name", "description"]
    filter_horizontal = ["tags"]


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ["freelancer", "platform", "url"]
    list_filter = ["platform"]
    search_fields = ["freelancer__user__username", "url"]

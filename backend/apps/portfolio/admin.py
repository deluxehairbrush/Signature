from django.contrib import admin
from .models import PortfolioItem


@admin.register(PortfolioItem)
class PortfolioItemAdmin(admin.ModelAdmin):
    list_display = ["title", "freelancer", "category", "is_public", "created_at"]
    list_filter = ["category", "is_public"]
    search_fields = ["title", "description", "freelancer__user__username"]

from django.urls import path
from . import views

app_name = "ai_integration"

urlpatterns = [
    path("ai/summarize-deal/", views.AISummarizeView.as_view(), name="ai-summarize"),
    path("ai/red-flags/", views.AIRedFlagsView.as_view(), name="ai-red-flags"),
]

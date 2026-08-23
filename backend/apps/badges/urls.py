from django.urls import path
from . import views

app_name = "badges"

urlpatterns = [
    path("badges/<str:username>/", views.BadgeView.as_view(), name="badge-svg"),
    path("badges/<str:username>/json/", views.BadgeJSONView.as_view(), name="badge-json"),
]

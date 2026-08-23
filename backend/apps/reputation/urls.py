from django.urls import path
from . import views

app_name = "reputation"

urlpatterns = [
    path("reputation/<str:username>/", views.PublicReputationView.as_view(), name="public-reputation"),
]

from django.urls import path
from . import views

app_name = "dashboard"

urlpatterns = [
    path("dashboard/freelancer/", views.FreelancerDashboardView.as_view(), name="freelancer-dashboard"),
    path("dashboard/client/", views.ClientDashboardView.as_view(), name="client-dashboard"),
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "search"

router = DefaultRouter()
router.register(r"freelancers", views.FreelancerSearchViewSet, basename="freelancer-search")
router.register(r"clients", views.ClientSearchViewSet, basename="client-search")

urlpatterns = [
    path("", include(router.urls)),
]

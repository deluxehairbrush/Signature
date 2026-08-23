from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "deals"

router = DefaultRouter()
router.register(r"deals", views.DealViewSet, basename="deals")

urlpatterns = [
    path("", include(router.urls)),
]

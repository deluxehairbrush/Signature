from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "signatures"

router = DefaultRouter()
router.register(r"signatures", views.DealSignatureViewSet, basename="signatures")

urlpatterns = [
    path("", include(router.urls)),
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "deals"

router = DefaultRouter()
router.register(r"deals", views.DealViewSet, basename="deals")
router.register(r"notifications", views.NotificationViewSet, basename="notifications")

urlpatterns = [
    # Must precede the router include: "open" would otherwise be swallowed
    # by the router's /deals/{pk}/ detail route as a literal pk value.
    path("deals/open/", views.OpenDealListView.as_view(), name="open-deals"),
    path("", include(router.urls)),
]

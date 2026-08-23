from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "profiles"

router = DefaultRouter()
router.register(r"freelancers/profile", views.FreelancerProfileViewSet, basename="freelancer-profile")
router.register(r"clients/profile", views.ClientProfileViewSet, basename="client-profile")
router.register(r"social-links", views.SocialLinkViewSet, basename="social-links")

urlpatterns = [
    path("", include(router.urls)),
    path("freelancers/<str:username>/", views.PublicFreelancerView.as_view(), name="public-freelancer"),
    path("clients/<str:username>/", views.PublicClientView.as_view(), name="public-client"),
]

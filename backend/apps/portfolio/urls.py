from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "portfolio"

router = DefaultRouter()
router.register(r"portfolio", views.PortfolioItemViewSet, basename="portfolio")

urlpatterns = [
    # Namespaced under freelancers/ (not portfolio/<username>/) so it can't
    # collide with the router's /portfolio/{pk}/ detail route above.
    path("freelancers/<str:username>/portfolio/", views.PublicPortfolioView.as_view(), name="public-portfolio"),
    path("", include(router.urls)),
]

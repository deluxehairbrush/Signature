from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI schema + docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.profiles.urls")),
    path("api/v1/", include("apps.portfolio.urls")),
    path("api/v1/", include("apps.tags.urls")),
    path("api/v1/", include("apps.deals.urls")),
    path("api/v1/", include("apps.signatures.urls")),
    path("api/v1/", include("apps.reputation.urls")),
    path("api/v1/", include("apps.ai_integration.urls")),
    path("api/v1/", include("apps.search.urls")),
    path("api/v1/", include("apps.dashboard.urls")),
    path("api/v1/", include("apps.badges.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

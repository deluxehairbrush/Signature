from django.conf import settings
from django.db import models


class PortfolioItem(models.Model):
    """A portfolio item belonging to a freelancer."""

    class Category(models.TextChoices):
        WEB_DEVELOPMENT = "WEB_DEVELOPMENT", "Web Development"
        MOBILE_DEVELOPMENT = "MOBILE_DEVELOPMENT", "Mobile Development"
        UI_UX = "UI_UX", "UI/UX Design"
        GRAPHIC_DESIGN = "GRAPHIC_DESIGN", "Graphic Design"
        COPYWRITING = "COPYWRITING", "Copywriting"
        VIDEO_EDITING = "VIDEO_EDITING", "Video Editing"
        AI_ML = "AI_ML", "AI/ML"
        OTHER = "OTHER", "Other"

    freelancer = models.ForeignKey(
        "profiles.FreelancerProfile",
        on_delete=models.CASCADE,
        related_name="portfolio_items",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    project_url = models.URLField(blank=True)
    image = models.ImageField(
        upload_to="portfolio_images/", blank=True, null=True
    )
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.OTHER,
    )
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

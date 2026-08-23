from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class FreelancerProfile(models.Model):
    """Public profile for freelancers."""

    class AvailabilityStatus(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        BUSY = "BUSY", "Busy"
        UNAVAILABLE = "UNAVAILABLE", "Unavailable"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="freelancer_profile",
    )
    display_name = models.CharField(max_length=200, blank=True)
    headline = models.CharField(max_length=300, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    timezone = models.CharField(max_length=100, blank=True)
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
    )
    currency = models.CharField(max_length=3, default="USD")
    availability_status = models.CharField(
        max_length=20,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE,
    )
    working_hours = models.CharField(max_length=100, blank=True)
    reputation_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Calculated by backend — do not edit manually.",
    )
    completed_deals = models.PositiveIntegerField(default=0)
    successful_deals = models.PositiveIntegerField(default=0)
    tags = models.ManyToManyField("tags.Tag", blank=True, related_name="freelancers")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-reputation_score", "-created_at"]

    def __str__(self):
        return f"{self.display_name or self.user.username} (Freelancer)"


class ClientProfile(models.Model):
    """Profile for clients / companies."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="client_profile",
    )
    company_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    industry = models.CharField(max_length=200, blank=True)
    tags = models.ManyToManyField("tags.Tag", blank=True, related_name="clients")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.company_name or self.user.username


class SocialLink(models.Model):
    """Social links for a freelancer profile."""

    class Platform(models.TextChoices):
        GITHUB = "GITHUB", "GitHub"
        LINKEDIN = "LINKEDIN", "LinkedIn"
        TWITTER = "TWITTER", "X / Twitter"
        INSTAGRAM = "INSTAGRAM", "Instagram"
        BEHANCE = "BEHANCE", "Behance"
        DRIBBBLE = "DRIBBBLE", "Dribbble"
        WEBSITE = "WEBSITE", "Website"
        OTHER = "OTHER", "Other"

    freelancer = models.ForeignKey(
        FreelancerProfile,
        on_delete=models.CASCADE,
        related_name="social_links",
    )
    platform = models.CharField(max_length=20, choices=Platform.choices)
    url = models.URLField(max_length=500)

    class Meta:
        ordering = ["platform"]
        unique_together = ["freelancer", "platform"]

    def __str__(self):
        return f"{self.platform}: {self.url}"

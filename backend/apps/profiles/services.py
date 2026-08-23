"""Profile business logic services."""

from typing import Any

FREELANCER_REQUIRED_FIELDS = [
    "display_name",
    "headline",
    "bio",
    "location",
    "hourly_rate",
    "availability_status",
    "working_hours",
]


def calculate_profile_completion(profile) -> dict[str, Any]:
    """Calculate freelancer profile completion percentage."""
    filled = 0
    missing = []

    # Check basic text fields
    for field in FREELANCER_REQUIRED_FIELDS:
        value = getattr(profile, field, None)
        if value and str(value).strip():
            filled += 1
        else:
            missing.append(field)

    # Check tags
    if profile.tags.exists():
        filled += 1
    else:
        missing.append("tags")

    # Check portfolio
    if profile.user.portfolio_items.exists():
        filled += 1
    else:
        missing.append("portfolio")

    # Check social links
    if profile.social_links.exists():
        filled += 1
    else:
        missing.append("social_links")

    total = len(FREELANCER_REQUIRED_FIELDS) + 3  # +tags, portfolio, social_links
    percentage = round((filled / total) * 100, 1)

    return {
        "completion_percentage": percentage,
        "missing_fields": missing,
    }


def calculate_client_profile_completion(profile) -> dict[str, Any]:
    """Calculate client profile completion percentage."""
    fields_to_check = ["company_name", "description", "industry", "location"]
    filled = 0
    missing = []

    for field in fields_to_check:
        value = getattr(profile, field, None)
        if value and str(value).strip():
            filled += 1
        else:
            missing.append(field)

    # Check website
    if profile.website and profile.website.strip():
        filled += 1
    else:
        missing.append("website")

    # Check tags
    if profile.tags.exists():
        filled += 1
    else:
        missing.append("tags")

    total = len(fields_to_check) + 2  # +website, tags
    percentage = round((filled / total) * 100, 1)

    return {
        "completion_percentage": percentage,
        "missing_fields": missing,
    }

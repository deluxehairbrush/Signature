import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.profiles.models import ClientProfile, FreelancerProfile
from apps.tags.models import Tag

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def freelancer_user(db):
    user = User.objects.create_user(
        email="freelancer@test.com",
        username="test_freelancer",
        password="testpass123",
        first_name="Test",
        last_name="Freelancer",
        user_type="FREELANCER",
    )
    return user


@pytest.fixture
def client_user(db):
    user = User.objects.create_user(
        email="client@test.com",
        username="test_client",
        password="testpass123",
        first_name="Test",
        last_name="Client",
        user_type="CLIENT",
    )
    return user


@pytest.fixture
def freelancer_profile(freelancer_user):
    profile = FreelancerProfile.objects.create(
        user=freelancer_user,
        display_name="Test Freelancer",
        headline="Full-Stack Developer",
        bio="Experienced developer",
        location="New York",
        hourly_rate=50,
        currency="USD",
        availability_status="AVAILABLE",
        working_hours="Mon-Fri 9AM-5PM",
    )
    tag = Tag.objects.create(name="Python", slug="python")
    profile.tags.add(tag)
    return profile


@pytest.fixture
def client_profile(client_user):
    return ClientProfile.objects.create(
        user=client_user,
        company_name="Test Corp",
        description="A test company",
        industry="Technology",
    )


@pytest.fixture
def auth_client_f(freelancer_user):
    """Authenticated as freelancer — owns its own APIClient instance."""
    client = APIClient()
    client.force_authenticate(user=freelancer_user)
    return client


@pytest.fixture
def auth_client_c(client_user):
    """Authenticated as client — owns its own APIClient instance."""
    client = APIClient()
    client.force_authenticate(user=client_user)
    return client

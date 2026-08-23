import pytest
from rest_framework import status

from apps.profiles.models import FreelancerProfile
from apps.tags.models import Tag


@pytest.mark.django_db
class TestFreelancerSearch:
    def test_search_by_keyword(self, api_client, freelancer_profile):
        response = api_client.get("/api/v1/freelancers/?search=Full-Stack")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_filter_by_availability(self, api_client, freelancer_profile):
        response = api_client.get("/api/v1/freelancers/?availability_status=AVAILABLE")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_tags(self, api_client, freelancer_profile):
        response = api_client.get("/api/v1/freelancers/?tags=python")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_filter_by_rate(self, api_client, freelancer_profile):
        response = api_client.get("/api/v1/freelancers/?min_rate=40&max_rate=60")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_reputation(self, api_client, freelancer_profile):
        response = api_client.get("/api/v1/freelancers/?min_reputation=0")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestClientSearch:
    def test_search_clients(self, api_client, client_profile):
        response = api_client.get("/api/v1/clients/?search=Test")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_industry(self, api_client, client_profile):
        response = api_client.get("/api/v1/clients/?industry=Technology")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestPublicProfiles:
    def test_public_freelancer_profile(self, api_client, freelancer_user, freelancer_profile):
        response = api_client.get(f"/api/v1/freelancers/{freelancer_user.username}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["profile"]["username"] == "test_freelancer"

    def test_public_client_profile(self, api_client, client_user, client_profile):
        response = api_client.get(f"/api/v1/clients/{client_user.username}/")
        assert response.status_code == status.HTTP_200_OK

    def test_nonexistent_profile(self, api_client):
        response = api_client.get("/api/v1/freelancers/nonexistent/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

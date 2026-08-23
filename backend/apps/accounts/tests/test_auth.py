import pytest
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


@pytest.mark.django_db
class TestRegistration:
    def test_register_success(self, api_client):
        response = api_client.post("/api/v1/auth/register/", {
            "email": "new@test.com",
            "username": "newuser",
            "first_name": "New",
            "last_name": "User",
            "user_type": "FREELANCER",
            "password": "securepass123",
            "password_confirm": "securepass123",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        assert "tokens" in response.data
        assert User.objects.filter(email="new@test.com").exists()

    def test_register_password_mismatch(self, api_client):
        response = api_client.post("/api/v1/auth/register/", {
            "email": "new@test.com",
            "username": "newuser",
            "password": "securepass123",
            "password_confirm": "differentpass",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_duplicate_email(self, api_client, freelancer_user):
        response = api_client.post("/api/v1/auth/register/", {
            "email": "freelancer@test.com",
            "username": "different",
            "password": "securepass123",
            "password_confirm": "securepass123",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client, freelancer_user):
        response = api_client.post("/api/v1/auth/login/", {
            "email": "freelancer@test.com",
            "password": "testpass123",
        }, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert "tokens" in response.data

    def test_login_invalid_credentials(self, api_client, freelancer_user):
        response = api_client.post("/api/v1/auth/login/", {
            "email": "freelancer@test.com",
            "password": "wrongpassword",
        }, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestMe:
    def test_me_authenticated(self, auth_client_f):
        response = auth_client_f.get("/api/v1/auth/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["user"]["username"] == "test_freelancer"

    def test_me_unauthenticated(self, api_client):
        response = api_client.get("/api/v1/auth/me/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

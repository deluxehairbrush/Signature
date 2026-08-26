from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import (
    TokenRefreshView as SimpleJWTTokenRefreshView,
)

from .serializers import (
    ChangePasswordSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class RegisterView(APIView):
    """POST /api/v1/auth/register/"""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "success": True,
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/v1/auth/login/"""

    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"success": False, "error": {"code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = get_tokens_for_user(user)
        return Response({"success": True, "user": UserSerializer(user).data, "tokens": tokens})


def _unique_username_from_email(email):
    base = email.split("@")[0][:140] or "user"
    username = base
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f"{base}{suffix}"[:150]
    return username


class GoogleAuthView(APIView):
    """POST /api/v1/auth/google/

    Verifies a Google Identity Services ID token (never the client
    secret — this flow doesn't need it) and either logs in an existing
    user matched by email, or creates one. user_type is required only
    when creating a new account.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        if not settings.GOOGLE_OAUTH_CLIENT_ID:
            return Response(
                {"success": False, "error": {"code": "GOOGLE_AUTH_NOT_CONFIGURED",
                    "message": "Google sign-in isn't configured on this server yet."}},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            from google.auth.transport import requests as google_requests
            from google.oauth2 import id_token as google_id_token

            claims = google_id_token.verify_oauth2_token(
                serializer.validated_data["id_token"],
                google_requests.Request(),
                settings.GOOGLE_OAUTH_CLIENT_ID,
            )
        except Exception:
            return Response(
                {"success": False, "error": {"code": "INVALID_GOOGLE_TOKEN",
                    "message": "Could not verify that Google sign-in. Try again."}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        email = claims.get("email")
        if not email or not claims.get("email_verified"):
            return Response(
                {"success": False, "error": {"code": "EMAIL_NOT_VERIFIED",
                    "message": "That Google account's email isn't verified."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(email=email).first()
        created = False

        if user is None:
            user_type = serializer.validated_data.get("user_type")
            if not user_type:
                return Response(
                    {"success": False, "error": {"code": "USER_TYPE_REQUIRED",
                        "message": "Choose freelancer or client to finish signing up."}},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user = User.objects.create_user(
                email=email,
                username=_unique_username_from_email(email),
                first_name=claims.get("given_name", ""),
                last_name=claims.get("family_name", ""),
                user_type=user_type,
                is_verified=True,
            )
            created = True

        tokens = get_tokens_for_user(user)
        return Response(
            {"success": True, "created": created, "user": UserSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class TokenRefreshView(SimpleJWTTokenRefreshView):
    """POST /api/v1/auth/token/refresh/

    Delegates to simplejwt's built-in refresh view, which handles
    token rotation and blacklist logic correctly.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class LogoutView(APIView):
    """POST /api/v1/auth/logout/

    Blacklists the supplied refresh token so it can no longer be used.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "error": {"code": "MISSING_REFRESH_TOKEN",
                    "message": "Refresh token is required for logout."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception as e:
            return Response(
                {"success": False, "error": {"code": "INVALID_REFRESH_TOKEN",
                    "message": "Invalid or already blacklisted refresh token."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"success": True, "message": "Logged out successfully."})


class MeView(APIView):
    """GET /api/v1/auth/me/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"success": True, "user": UserSerializer(request.user).data})


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"success": True, "message": "Password changed successfully."})

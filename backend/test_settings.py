"""Test-only settings — self-contained, no live PostgreSQL or HTTPS required."""
from config.settings import *  # noqa: F401,F403

DEBUG = True

# Use SQLite so the test suite runs without PostgreSQL
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Disable production security guards that break test requests
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_PROXY_SSL_HEADER = None

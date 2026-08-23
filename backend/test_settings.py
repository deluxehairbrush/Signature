"""Test-only settings override — uses SQLite so the test suite can run
without a live PostgreSQL instance.  This file is NOT used in production
or development; only by the test runner."""
from config.settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# token_blacklist needs its own tables; SQLite handles fine
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

#!/bin/sh
set -e

python manage.py migrate --noinput
python manage.py seed_demo
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
U = get_user_model()
email = os.environ['DJANGO_SUPERUSER_EMAIL']
u, _ = U.objects.get_or_create(email=email, defaults={'username': os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')})
u.is_staff = True
u.is_superuser = True
u.is_active = True
u.set_password(os.environ['DJANGO_SUPERUSER_PASSWORD'])
u.save()
"
fi

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3

#!/bin/sh
set -e

python manage.py migrate
python manage.py collectstatic --noinput

exec gunicorn core.wsgi:application --bind 0.0.0.0:8000
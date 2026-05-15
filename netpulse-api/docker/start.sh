#!/bin/sh
set -e

php artisan package:discover --ansi
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Inject PORT into nginx config (only substitutes ${PORT}, leaves $uri etc. alone)
PORT=${PORT:-8000} envsubst '${PORT}' \
    < /var/www/docker/nginx.conf.template \
    > /etc/nginx/conf.d/app.conf

rm -f /etc/nginx/sites-enabled/default

exec supervisord -c /var/www/docker/supervisord.conf

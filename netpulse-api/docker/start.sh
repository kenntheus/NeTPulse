#!/bin/sh

echo "==> Fixing storage permissions..."
chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || \
    chmod -R 777 /var/www/storage /var/www/bootstrap/cache

echo "==> Running migrations..."
php artisan package:discover --ansi 2>&1 || true
php artisan migrate --force 2>&1

echo "==> Seeding database..."
php artisan db:seed --force 2>&1 || echo "Seeder skipped (may already exist)"

echo "==> Caching..."
php artisan config:cache 2>&1 || true
php artisan route:cache 2>&1 || true
php artisan view:cache  2>&1 || true

echo "==> Building nginx config..."
PORT=${PORT:-8000}
export PORT
cp /var/www/docker/nginx.cors.conf /etc/nginx/conf.d/cors_map.conf
envsubst '${PORT}' \
    < /var/www/docker/nginx.conf.template \
    > /etc/nginx/conf.d/app.conf

rm -f /etc/nginx/sites-enabled/default

echo "==> Starting server on port ${PORT}..."
exec supervisord -c /var/www/docker/supervisord.conf

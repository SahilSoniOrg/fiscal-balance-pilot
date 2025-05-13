#!/bin/sh
set -e

# Substitute environment variables in Nginx configuration template
# If GO_BACKEND_URL is not set, default to http://localhost:8080 (adjust if your default is different)
export GO_BACKEND_URL=${GO_BACKEND_URL:-http://localhost:8080}

envsubst '$GO_BACKEND_URL' < /etc/nginx/templates/nginx.template.conf > /etc/nginx/conf.d/default.conf

# Output the generated Nginx config for debugging (optional)
echo "--- Generated Nginx Configuration ---"
cat /etc/nginx/conf.d/default.conf
echo "-------------------------------------"

# Start Nginx
exec nginx -g 'daemon off;'

#!/bin/sh
set -e

# === Nginx Backend Proxy Configuration ===
# Substitute environment variables in Nginx configuration template
# If GO_BACKEND_URL is not set, default to http://localhost:8080 (adjust if your default is different)
export GO_BACKEND_URL=${GO_BACKEND_URL:-http://localhost:8080}
envsubst '$GO_BACKEND_URL' < /etc/nginx/templates/nginx.template.conf > /etc/nginx/conf.d/default.conf

# Output the generated Nginx config for debugging (optional)
echo "--- Generated Nginx Configuration (default.conf) ---"
cat /etc/nginx/conf.d/default.conf
echo "----------------------------------------------------"

# === Frontend Runtime Environment Configuration ===
# Define runtime environment variables for the frontend
# Set defaults if they are not provided by the Docker environment
export RUNTIME_VITE_GOOGLE_CLIENT_ID=${RUNTIME_VITE_GOOGLE_CLIENT_ID:-YOUR_DEFAULT_GOOGLE_CLIENT_ID_IF_ANY}
# Add other RUNTIME_VITE_ variables here with their defaults, e.g.:
# export RUNTIME_VITE_ANOTHER_KEY=${RUNTIME_VITE_ANOTHER_KEY:-default_value}

# Substitute these runtime variables into the env-config.template.js
# and create the actual env-config.js in the Nginx webroot directory.
# Note: envsubst will only substitute variables explicitly listed (e.g., '$RUNTIME_VITE_GOOGLE_CLIENT_ID').
# If you add more variables to env-config.template.js, add them to the envsubst command here.
CONFIG_TEMPLATE_PATH=/etc/nginx/templates/env-config.template.js
CONFIG_OUTPUT_PATH=/usr/share/nginx/html/env-config.js

envsubst '$RUNTIME_VITE_GOOGLE_CLIENT_ID' < "$CONFIG_TEMPLATE_PATH" > "$CONFIG_OUTPUT_PATH"
# Example for multiple variables: 
# envsubst '$RUNTIME_VITE_GOOGLE_CLIENT_ID,$RUNTIME_VITE_ANOTHER_KEY' < "$CONFIG_TEMPLATE_PATH" > "$CONFIG_OUTPUT_PATH"


echo "--- Generated Frontend Runtime Configuration (env-config.js) ---"
cat "$CONFIG_OUTPUT_PATH"
echo "---------------------------------------------------------------"


# Start Nginx
exec nginx -g 'daemon off;'

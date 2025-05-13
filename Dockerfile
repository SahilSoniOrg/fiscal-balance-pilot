# Stage 1: Build the Vite application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If using yarn, uncomment the next line and comment out the npm ci line
# COPY yarn.lock ./

# Install dependencies
# If using yarn, use 'yarn install --frozen-lockfile'
RUN npm ci

# Copy the rest of the application code
# This will include public/env-config.template.js
COPY . .

# VITE_ prefixed environment variables used by client-side code (import.meta.env.VITE_*) 
# are no longer directly injected here if they are handled by env-config.js at runtime.
# If you have other VITE_ variables that ARE NOT handled by env-config.js and ARE needed at build time,
# you would still use ARG and ENV for them here.
# For example:
# ARG VITE_ANOTHER_BUILD_TIME_VAR
# ENV VITE_ANOTHER_BUILD_TIME_VAR=$VITE_ANOTHER_BUILD_TIME_VAR

# Build the application
# Replace 'npm run build' if your build script is different
# Vite will copy public/env-config.template.js to dist/env-config.template.js
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Default Go backend URL (can be overridden at runtime by setting GO_BACKEND_URL environment variable)
ENV GO_BACKEND_URL=http://localhost:8080

WORKDIR /usr/share/nginx/html

# Remove default Nginx static assets
# RUN rm -rf . # User commented this out, respecting that change

# Copy static assets from builder stage
COPY --from=builder /app/dist .

# Copy Nginx configuration template and the new frontend runtime config template
COPY nginx.template.conf /etc/nginx/templates/nginx.template.conf
COPY --from=builder /app/dist/env-config.template.js /etc/nginx/templates/env-config.template.js

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80 for Nginx
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command (already handled by entrypoint starting nginx)
# CMD ["nginx", "-g", "daemon off;"]

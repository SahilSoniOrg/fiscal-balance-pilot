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
COPY . .

# Set build-time environment variables if needed by your Vite build process
# For example, if your app needs VITE_GOOGLE_CLIENT_ID at build time:
# ARG VITE_GOOGLE_CLIENT_ID
# ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
# (You would pass this with --build-arg VITE_GOOGLE_CLIENT_ID=your_value during docker build)

# Build the application
# Replace 'npm run build' if your build script is different
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Default Go backend URL (can be overridden at runtime by setting GO_BACKEND_URL environment variable)
ENV GO_BACKEND_URL=http://localhost:8080

WORKDIR /usr/share/nginx/html

# Remove default Nginx static assets
# RUN rm -rf .

# Copy static assets from builder stage
COPY --from=builder /app/dist .

# Copy Nginx configuration template and entrypoint script
COPY nginx.template.conf /etc/nginx/templates/nginx.template.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Expose port 80 for Nginx
EXPOSE 80

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command (already handled by entrypoint starting nginx)
# CMD ["nginx", "-g", "daemon off;"]

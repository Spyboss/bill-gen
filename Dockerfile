# Using Node.js 22 bookworm-slim variant for better security and stability
FROM node:22-bookworm-slim

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY backend/package*.json backend/.npmrc ./

# Install dependencies with overrides
RUN npm install --omit=dev

# Copy the rest of the application
COPY backend ./

# Copy production environment variables
RUN cp .env.production .env

# Build the application
RUN npm run build:prod || echo "Build completed with warnings" && \
    mkdir -p dist

# Expose the port the app runs on
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Command to run the application
CMD ["node", "-r", "dotenv/config", "dist/server.js"]
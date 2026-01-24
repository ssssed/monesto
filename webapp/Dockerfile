# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application (PUBLIC variables are required for build)
ARG PUBLIC_TELEGRAM_DEV_ID=""
ARG PUBLIC_API_URL="http://localhost:3000/api"
RUN echo "PUBLIC_TELEGRAM_DEV_ID=${PUBLIC_TELEGRAM_DEV_ID}" > .env.production && \
    echo "PUBLIC_API_URL=${PUBLIC_API_URL}" >> .env.production && \
    npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/static ./static

# Expose port (SvelteKit adapter-node default port is 3000)
EXPOSE 3000

# Start application
CMD ["node", "build/index.js"]


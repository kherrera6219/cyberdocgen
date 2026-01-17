# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application (client + server)
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]

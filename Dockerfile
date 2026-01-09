# Multi-stage Docker build for SkillGap AI System

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
RUN npm run build

# Stage 3: Production Runtime
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/src ./src

# Copy built frontend to be served by backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S skillgap -u 1001

# Set ownership and permissions
RUN chown -R skillgap:nodejs /app
USER skillgap

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server.js"]
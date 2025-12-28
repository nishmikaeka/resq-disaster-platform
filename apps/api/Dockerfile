# Build stage
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy necessary files
COPY apps/api ./apps/api
COPY prisma ./prisma

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Set placeholder for Prisma generation
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# Generate Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build the API
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/apps/api/package*.json ./

# Expose port
EXPOSE 8000

# Start command
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main
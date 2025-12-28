# Build stage
FROM node:18-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy the entire monorepo structure
COPY apps/api ./apps/api
COPY prisma ./prisma

# Install dependencies using npm
RUN npm ci

# Set DATABASE_URL for Prisma generation
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/resq_db?schema=public"

# Generate Prisma Client (pointing to root prisma folder)
WORKDIR /app
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build the API
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client again in production
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000

CMD ["node", "dist/main"]
# ============================================================
# packages/server/Dockerfile — build context = packages/server
# Used for local Docker builds:
#   docker build -t partyhub-server packages/server
# ============================================================

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependency install layer
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and compile
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma       ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/app.js"]

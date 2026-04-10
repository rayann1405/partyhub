# ================================================================
# Dockerfile racine — monorepo npm workspaces
# Utilise node:20-slim (Debian) pour la compatibilité Prisma
# ================================================================

# ---- Stage 1 : Install toutes les dépendances ----
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/client/package.json  ./packages/client/
COPY packages/server/package.json  ./packages/server/
COPY packages/server/prisma        ./packages/server/prisma/

RUN npm ci


# ---- Stage 2 : Build React (Vite) ----
FROM node:20-slim AS client-builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY packages/client               ./packages/client

WORKDIR /app/packages/client
RUN npm run build


# ---- Stage 3 : Build Express (TypeScript) ----
FROM node:20-slim AS server-builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY packages/server               ./packages/server

WORKDIR /app/packages/server
RUN npm run build


# ---- Stage 4 : Image de production ----
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=server-builder /app/node_modules          ./node_modules
COPY --from=server-builder /app/packages/server/dist  ./dist
COPY --from=server-builder /app/packages/server/prisma ./prisma
COPY --from=server-builder /app/packages/server/package.json ./

COPY --from=client-builder /app/packages/client/dist  ./public

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/app.js"]

# ================================================================
# Dockerfile racine — build context = repo root
# Construit le frontend ET le backend dans un seul conteneur.
# Le serveur Express sert l'API + les fichiers statiques React.
#
# Déploiement recommandé : Render.com (free) + Neon (free PostgreSQL)
# ================================================================

# ---- Stage 1 : Build React (Vite) ----
FROM node:20-alpine AS client-builder
WORKDIR /app

COPY packages/client/package*.json ./packages/client/
WORKDIR /app/packages/client
RUN npm ci

WORKDIR /app
COPY packages/client ./packages/client

# VITE_API_URL vide → URLs relatives → même origine que l'API
WORKDIR /app/packages/client
RUN npm run build


# ---- Stage 2 : Build Express (TypeScript) ----
FROM node:20-alpine AS server-builder
WORKDIR /app

COPY packages/server/package*.json ./packages/server/
COPY packages/server/prisma        ./packages/server/prisma/
WORKDIR /app/packages/server
RUN npm ci

WORKDIR /app
COPY packages/server ./packages/server

WORKDIR /app/packages/server
RUN npm run build


# ---- Stage 3 : Image de production ----
FROM node:20-alpine
WORKDIR /app

# Artefacts du serveur
COPY --from=server-builder /app/packages/server/dist          ./dist
COPY --from=server-builder /app/packages/server/node_modules  ./node_modules
COPY --from=server-builder /app/packages/server/prisma        ./prisma
COPY --from=server-builder /app/packages/server/package*.json ./

# Build React → servi comme fichiers statiques par Express (/public)
COPY --from=client-builder /app/packages/client/dist ./public

EXPOSE 3000

# Synchronise le schéma Prisma puis démarre l'API
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/app.js"]

# ================================================================
# Dockerfile racine — monorepo npm workspaces
# Un seul package-lock.json à la racine → npm ci depuis la racine
# ================================================================

# ---- Stage 1 : Install toutes les dépendances ----
FROM node:20-alpine AS deps
WORKDIR /app

# Copier le lockfile racine + tous les package.json des workspaces
COPY package.json package-lock.json ./
COPY packages/client/package.json  ./packages/client/
COPY packages/server/package.json  ./packages/server/
COPY packages/server/prisma        ./packages/server/prisma/

# npm ci lit le lockfile racine et installe tout dans /app/node_modules
RUN npm ci


# ---- Stage 2 : Build React (Vite) ----
FROM node:20-alpine AS client-builder
WORKDIR /app

COPY --from=deps /app/node_modules        ./node_modules
COPY --from=deps /app/package.json        ./
COPY packages/client                      ./packages/client

WORKDIR /app/packages/client
RUN npm run build


# ---- Stage 3 : Build Express (TypeScript) ----
FROM node:20-alpine AS server-builder
WORKDIR /app

COPY --from=deps /app/node_modules        ./node_modules
COPY --from=deps /app/package.json        ./
COPY packages/server                      ./packages/server

WORKDIR /app/packages/server
RUN npm run build


# ---- Stage 4 : Image de production ----
FROM node:20-alpine
WORKDIR /app

# Serveur Express
COPY --from=server-builder /app/node_modules          ./node_modules
COPY --from=server-builder /app/packages/server/dist  ./dist
COPY --from=server-builder /app/packages/server/prisma ./prisma
COPY --from=server-builder /app/packages/server/package.json ./

# Build React → servi comme fichiers statiques par Express
COPY --from=client-builder /app/packages/client/dist  ./public

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/app.js"]

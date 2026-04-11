# 🎉 PartyHub

Plateforme web de gestion de soirées étudiantes avec système de vote en temps réel.

## Stack

- **Frontend** : React 18 + Vite + TailwindCSS + Framer Motion + Zustand
- **Backend** : Node 20 + Express + Socket.IO + Prisma + Zod
- **Base de données** : PostgreSQL 16
- **Déploiement** : Railway

---

## 🚀 Démarrage rapide (local)

### Prérequis
- Node.js 20+
- Docker (pour PostgreSQL)

### 1. Cloner et installer

```bash
git clone <repo-url> partyhub
cd partyhub
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env si besoin (les défauts conviennent au dev local avec Docker)
cp .env packages/server/.env
```

### 3. Lancer PostgreSQL et initialiser la base

Docker doit être **démarré** et ton utilisateur doit pouvoir utiliser le socket Docker (sinon : `sudo usermod -aG docker $USER` puis reconnexion).

```bash
npm run db:setup
```

Cela exécute : conteneur Postgres (avec attente du healthcheck), `prisma db push`, puis le seed.

Sans le script tout-en-un :

```bash
docker compose up -d --wait   # ou : docker compose up -d puis attendre quelques secondes
cd packages/server && npx prisma db push && npm run db:seed && cd ../..
```

#### Erreur `P1001` / « Can't reach database server at localhost:5432 »

- Vérifie que le conteneur tourne : `docker compose ps` (statut `healthy` pour `db`).
- Erreur « permission denied » sur Docker : corrige l’accès au daemon Docker (groupe `docker`, ou lance la commande dans un environnement où Docker est disponible).
- Si tu n’utilises pas Docker : mets une URL Postgres distante (ex. [Neon](https://neon.tech)) dans `DATABASE_URL` (racine et `packages/server/.env`), puis `npm run db:push` et `npm run db:seed` depuis `packages/server`.

### 4. Lancer le projet

```bash
npm run dev
```

- Frontend : http://localhost:5173
- Backend : http://localhost:3000
- API Health : http://localhost:3000/health

### Comptes de test (après seed)

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@partyhub.com | admin123456 | ADMIN |
| alice@test.com | user123456 | USER |
| bob@test.com | user123456 | USER |

---

## 🚂 Déploiement Railway

### 1. Créer le projet

1. Aller sur [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo

### 2. Ajouter PostgreSQL

1. "+ New" → Database → PostgreSQL
2. `DATABASE_URL` est auto-injectée

### 3. Service Backend

- **Source** : même repo GitHub
- **Root Directory** : `packages/server`
- **Build Command** : `npm ci && npx prisma generate && npm run build`
- **Start Command** : `npx prisma db push && npm run start`
- **Variables d'environnement** :
  ```
  JWT_SECRET=<générer avec: openssl rand -hex 32>
  JWT_REFRESH_SECRET=<générer avec: openssl rand -hex 32>
  CLIENT_URL=https://<votre-frontend>.railway.app
  NODE_ENV=production
  ```

### 4. Service Frontend

- **Source** : même repo GitHub
- **Root Directory** : `packages/client`
- **Build Command** : `npm ci && npm run build`
- **Start Command** : `npx serve dist -s -l $PORT`
- **Variables d'environnement** :
  ```
  VITE_API_URL=https://<votre-backend>.railway.app
  ```

### 5. Seed initial (une seule fois)

Dans le terminal Railway du service backend :
```bash
npx tsx src/prisma/seed.ts
```

---

## 📁 Structure

```
partyhub/
├── packages/
│   ├── client/          # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── types/
│   │   └── ...
│   └── server/          # Express backend
│       ├── src/
│       │   ├── controllers/
│       │   ├── middleware/
│       │   ├── services/
│       │   ├── socket/
│       │   └── prisma/
│       └── ...
├── docker-compose.yml
└── .env.example
```

## 📡 API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /api/auth/register | — | Inscription |
| POST | /api/auth/login | — | Connexion |
| POST | /api/auth/refresh | — | Refresh token |
| GET | /api/auth/me | ✅ | Mon profil |
| GET | /api/events | — | Liste événements |
| GET | /api/events/:id | — | Détail événement |
| POST | /api/events | 🔒 Admin | Créer événement |
| PUT | /api/events/:id | 🔒 Admin | Modifier événement |
| DELETE | /api/events/:id | 🔒 Admin | Supprimer événement |
| POST | /api/events/:id/join | ✅ | S'inscrire |
| DELETE | /api/events/:id/leave | ✅ | Se désinscrire |
| POST | /api/votes/:topicId | ✅ | Voter |
| GET | /api/votes/:topicId/results | — | Résultats |
| POST | /api/events/:id/comments | ✅ | Commenter |
| DELETE | /api/comments/:id | ✅ | Supprimer commentaire |

## ⚡ Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| event:join | Client → Server | Rejoindre la room d'un event |
| event:leave | Client → Server | Quitter la room |
| event:new | Server → All | Nouvel événement créé |
| vote:update | Server → Room | Résultats de vote mis à jour |
| comment:new | Server → Room | Nouveau commentaire |

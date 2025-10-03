# Étape 1 : Build avec TypeScript
FROM node:18-alpine AS builder
WORKDIR /app

# Copier le code source
COPY tsconfig.json ./
COPY package*.json ./
COPY ./src ./src
COPY ./public ./public

# Supprimer les fichiers sensibles s'ils existent
RUN rm -f .env* public/.env* src/.env*

# Installer les dépendances
RUN npm ci

# Build TypeScript → JavaScript
RUN npm run build

# Étape 2 : Image finale
FROM node:18-alpine AS runner
WORKDIR /app

# Copier uniquement les fichiers nécessaires à l'exécution
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Ajout d'un utilisateur non-root avec UID/GID fixes
RUN addgroup -g 1800 -S floraccessgroup && adduser -u 1800 -S floraccessuser -G floraccessgroup
USER floraccessuser

# Par défaut : lance le serveur
CMD ["node", "dist/server.js"]
# Étape 1 : Build avec TypeScript
FROM node:latest AS builder
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
FROM node:latest AS runner
WORKDIR /app

# Copier uniquement les fichiers nécessaires à l'exécution
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Ajout d'un utilisateur non-root avec UID/GID fixes
# Utiliser les options longues pour éviter les ambiguïtés entre différentes variantes d'adduser/addgroup
RUN addgroup --gid 1800 --system floraccessgroup && \
	adduser --uid 1800 --system --ingroup floraccessgroup --disabled-password --gecos "" --no-create-home floraccessuser
USER floraccessuser

# Par défaut : lance le serveur
CMD ["node", "dist/server.js"]
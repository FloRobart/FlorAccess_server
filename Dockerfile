# Étape 1 : Build avec TypeScript
FROM node:18-alpine AS builder
WORKDIR /app

# Copier le code source
COPY tsconfig.json ./
COPY package*.json ./
COPY ./src ./src

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

# Ajout d'un utilisateur non-root avec UID/GID fixes
RUN addgroup -g 1800 -S floraccessgroup && adduser -u 1800 -S floraccessuser -G floraccessgroup
USER floraccessuser

# Par défaut : lance le serveur
CMD ["node", "dist/server.js"]
# Étape 1 : Build avec TypeScript
FROM node:18-alpine AS builder
WORKDIR /app

# Copier le reste du code
COPY . .

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

# Par défaut : lance le serveur
CMD ["node", "dist/index.js"]
# FlorAccess API

# Table des matière

- [FlorAccess API](#floraccess-api)
- [Table des matière](#table-des-matière)
- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Écosystème](#écosystème)
- [Installation](#installation)
  - [Pour le développement](#pour-le-développement)
  - [Pour la production](#pour-la-production)
- [CI et versions](#ci-et-versions)
- [Auteur](#auteur)
- [Report de bug et suggestions](#report-de-bug-et-suggestions)
- [License](#license)

# Présentation

FlorAccess est une API d'authentification et de gestion des utilisateurs. Elle permet d'enregistrer les utilisateurs, et données l'accès à n'importe quelle application qui accepte les JWT générés par FlorAccess.

# Fonctionnalités

- [x] Enregistrement des utilisateurs
- [x] Connexion sans MDP via un code envoyé par e-mail
- [x] Modification des informations utilisateur
- [x] Suppression des utilisateurs
- [x] Vérification des adresses e-mail
- [x] Déconnexion d'un utilisateur de tous les appareils

# Écosystème

| Dépôt | Rôle |
|---|---|
| [floraccess-api](https://github.com/FloRobart/floraccess-api) | Cette API, publiée en image Docker `florobart/floraccess-api` |
| [floraccess-database](https://github.com/FloRobart/floraccess-database) | La base PostgreSQL et ses migrations (image `florobart/floraccess-migrations`) |
| [floraccess-app](https://github.com/FloRobart/floraccess-app) | Le panel d'administration (Flutter), publié en image Docker `florobart/floraccess-app` |
| [floraccess-proxy](https://github.com/FloRobart/floraccess-proxy) | Le reverse proxy Traefik : domaines, HTTPS, limite de requêtes |
| [floraccess-wrapper](https://github.com/FloRobart/floraccess-wrapper) | Lance tout l'écosystème en production : déploiement, sauvegardes, secrets |

L'API ne contient rien sur la base de données : le schéma, les migrations et le rôle avec lequel l'API se connecte en production sont dans `floraccess-database`.

# Installation

## Pour le développement

1. Démarrer la base de données de développement, depuis le dépôt [floraccess-database](https://github.com/FloRobart/floraccess-database) (voir son README) :

    ```bash
    docker compose -f docker-compose.dev.yml up -d
    ```

    Elle crée le réseau Docker `floraccess-net`, que l'API rejoint.

2. Cloner ce dépôt, puis s'y placer :

    ```bash
    git clone https://github.com/FloRobart/floraccess-api.git
    ```

    ```bash
    cd floraccess-api
    ```

3. Installer les dépendances :

    ```bash
    npm install
    ```

4. Créer le fichier `.env` à partir de `.env.example`. Les secrets y sont commentés : en développement, `DB_PASSWORD` a une valeur par défaut dans `docker-compose.dev.yml`. **Décommenter `JWT_SIGNING_KEY` et lui donner une valeur** : il n'y a pas de clé par défaut, l'API ne démarre pas sans elle.

    ```bash
    cp .env.example .env
    ```

5. Démarrer le serveur en mode développement :

    ```bash
    npm run dev-docker
    ```

6. Le serveur devrait maintenant être accessible à l'adresse `http://localhost:26001`.
7. Accéder à la documentation de l'API via Swagger à l'adresse `http://localhost:26001/api-docs`.

Vérifications lancées par la CI, à lancer en local avant une pull request :

```bash
npm ci && npm run lint && npm run format:check && npm run typecheck && npm test
```

## Pour la production

En production, [floraccess-wrapper](https://github.com/FloRobart/floraccess-wrapper) déploie l'API avec le reste de l'écosystème (proxy, base, migrations et panel) : il crée les secrets, sauvegarde la base, applique les migrations, puis démarre l'API. Voir son README.

Cette section décrit comment lancer ce dépôt seul. `docker-compose.yml` est réservé à la production. L'API n'y publie aucun port : elle n'est joignable que par le reverse proxy (Traefik), qui doit rejoindre le réseau `floraccess-api-net` et router le domaine de l'API vers `http://floraccess-api:80`.

**Toujours déployer la base avant l'API** (voir le README de `floraccess-database`) : l'API a besoin du schéma à jour et de son rôle `floraccess_api`.

1. Copier `docker-compose.yml` et créer le `.env` à partir de `.env.example`, avec les valeurs de production. En particulier :

    - `DB_USER=floraccess_api` : le rôle de l'API, qui peut seulement lire et écrire les lignes des tables ;
    - `DB_HOST=floraccess-database` ;
    - `BASE_URL` : l'adresse publique de l'API ;
    - `CORS_ALLOWED_ORIGINS` : les adresses des applications qui appellent l'API depuis un navigateur ;
    - `MAIL_USERNAME` : le compte qui envoie les emails.

    `APP_ENV` est forcé à `prod` par `docker-compose.yml`.

2. Créer les secrets dans le dossier `secrets/` (jamais commité), chacun seul dans son fichier :

    - `secrets/db_password` : le mot de passe du rôle `floraccess_api`, le même que `secrets/api_db_password` de `floraccess-database` ;
    - `secrets/mail_password` : le mot de passe (ou mot de passe d'application) du compte email ;
    - `secrets/jwt_signing_key` : la clé qui signe les JWT. L'API ne démarre pas sans elle : il n'y a pas de clé par défaut. ⚠️ Garder la clé actuelle : une nouvelle clé invalide tous les JWT déjà distribués, et déconnecte tous les utilisateurs de toutes les applications. Pour une première installation : `openssl rand -hex 64`.

    Le dossier protège les fichiers sur l'hôte. Les fichiers restent lisibles, car le conteneur les lit avec un utilisateur non-root :

    ```bash
    chmod 700 secrets
    ```

    ```bash
    chmod 644 secrets/db_password secrets/mail_password secrets/jwt_signing_key
    ```

3. Récupérer l'image, puis démarrer. La dernière release est prise par défaut ; pour une autre version, la définir dans `API_VERSION` :

    ```bash
    docker compose pull
    ```

    ```bash
    docker compose up -d
    ```

4. Vérifier que le conteneur est `healthy` :

    ```bash
    docker compose ps
    ```

Le conteneur tourne sans aucun droit d'écriture, sans capacité Linux, avec un utilisateur dédié (UID 1800) et des ressources limitées. Les secrets sont lus dans des fichiers (variables `*_FILE`) : ils n'apparaissent pas dans `docker inspect`.

# CI et versions

La CI vient de [FloRobart/github-ci](https://github.com/FloRobart/github-ci) (`.github/workflows/ci.yml`) :

- **Pull request** : règles du git flow, messages de commit au format [Conventional Commits](https://www.conventionalcommits.org/fr/), lint, format, types, tests et build de l'image Docker.
- **Bouton Run workflow sur `dev`** : release candidate `vX.Y.Z-rc.N`.
- **Merge sur `main`** : version finale `vX.Y.Z`, image `florobart/floraccess-api:X.Y.Z` et `latest` sur Docker Hub et GHCR.

La version est calculée à partir des messages de commit : ne pas modifier la `version` du `package.json` à la main.

Dependabot (`.github/dependabot.yml`) propose chaque mois, vers `dev`, les mises à jour des dépendances npm et des images de base du `Dockerfile`.

# Auteur

FlorAccess est un projet open-source développé uniquement par [Floris Robart](https://florobart.github.io/)

# Report de bug et suggestions

Pour signaler une faille de sécurité, voir [SECURITY.md](SECURITY.md).

Si vous découvrez une erreur, quelquelle soit, cela peut êgre une faute de frappe ou d'orthographe, une erreur de calcul, une erreur de conception, un bug qui empêche le bon fonctionnement de l'application, ou tout autre problème, Merci de me le signaler par email à l'adresse [florobart.github@gmail.com](mailto:florobart.github@gmail.com). Toutes les erreurs, quelque soit leur nature ou leur importance, seront traitées le plus rapidement possible.

Si vous avez une une **suggestion**, une **idée**, une **amélioration**, ou une **demande de fonctionnalité**, merci de me la communiquer par email à l'adresse [florobart.github@gmail.com](mailto:florobart.github@gmail.com). Toutes les suggestions, quelque soit leur nature ou leur importance, seront étudiées et prises en compte dans la mesure du possible.

# License

FlorAccess est un projet open-source sous licence [GNU General Public License v3.0](https://opensource.org/licenses/GPL-3.0).

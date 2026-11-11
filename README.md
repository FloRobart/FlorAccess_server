# FlorAccess API

# Table des matière

- [FlorAccess API](#floraccess-api)
- [Table des matière](#table-des-matière)
- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Sécurité](#sécurité)
  - [Inscription et changement d'adresse email](#inscription-et-changement-dadresse-email)
  - [Sessions](#sessions)
  - [Limites de requêtes et d'emails](#limites-de-requêtes-et-demails)
  - [Codes de connexion](#codes-de-connexion)
  - [Jetons et journaux](#jetons-et-journaux)
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

# Sécurité

Ce que les applications qui utilisent FlorAccess doivent savoir. Les valeurs par défaut se changent dans le `.env` (voir `.env.example`).

## Inscription et changement d'adresse email

Aucun JWT n'est donné pour une adresse qui n'est pas encore prouvée :

| Route | Réponse |
| --- | --- |
| `POST /users` | `202` avec un `message`, sans JWT. Le lien de vérification part vers l'adresse. Même réponse si l'adresse est déjà utilisée : la route ne révèle pas quels comptes existent. L'utilisateur se connecte ensuite avec un code. |
| `PUT /users` avec une nouvelle adresse | `202` avec un `message`, sans JWT. Le lien de vérification part vers la nouvelle adresse, et toutes les sessions du compte sont fermées : il faut se reconnecter avec un code envoyé à la nouvelle adresse. Même réponse et même fermeture des sessions si la nouvelle adresse est déjà utilisée par un autre compte. |
| `PUT /users` sans changement d'adresse | `200` avec le nouveau JWT, comme avant. |
| `POST /users/login/request` avec une adresse inconnue | Crée le compte et envoie le code, comme avant : la connexion sert aussi d'inscription. |

Le nom d'application passé à `POST /users` (`?application=`) n'apparaît plus dans l'email : il ne sert qu'au bouton de retour de la page de vérification, qui n'est affiché que pour les domaines autorisés (`CORS_ALLOWED_ORIGINS`).

## Sessions

- Toutes les routes qui utilisent un JWT (`GET /users`, `GET /users/jwt`, `PUT /users`, `DELETE /users`, `POST /users/logout`, `/admins/*`) vérifient d'abord que sa session est ouverte, et répondent `401` sinon : utilisateur déconnecté, JWT émis avant la dernière déconnexion, ou **adresse email jamais prouvée** (JWT donné par l'ancienne inscription, avant la 3.0.0). Une application qui reçoit un `401` doit reconnecter l'utilisateur avec un code.
- Les JWT sont signés et vérifiés en HS256 uniquement.
- Un JWT ne dépasse jamais la fin de sa session (`SESSION_MAX_DURATION` après la connexion) : un JWT régénéré peu avant cette fin expire avec elle.
- `POST /users/login/confirm` répond `401` `"Invalid token"` sans le bon jeton, que l'adresse ait un compte ou non, que son code ait expiré ou que ses connexions soient bloquées : seul l'appareil qui a demandé le code apprend pourquoi la connexion est refusée.

## Limites de requêtes et d'emails

N'importe qui peut faire envoyer un email par l'API. Sans limite, le quota du compte email (500 destinataires par jour pour Gmail) serait vite épuisé, et plus personne ne recevrait de code de connexion.

| Limite | Variable | Par défaut | Au-delà |
| --- | --- | --- | --- |
| Requêtes qui envoient des emails (`POST /users`, `PUT /users`, `POST /users/login/request`, `POST /admins/user`, `POST /admins/users/send/verify-email`, `POST /admins/users/send/email`), par adresse IP, toutes ces routes ensemble | `EMAIL_REQUEST_LIMIT` par `EMAIL_REQUEST_LIMIT_TIME` | 12 par heure | `429` |
| Requêtes d'inscription, de connexion et de vérification d'email (`POST /users`, `/users/login/*`, `/users/email/*`), par adresse IP, toutes ces routes ensemble | `AUTH_REQUEST_LIMIT` par `AUTH_REQUEST_LIMIT_TIME` | 120 par heure | `429` |
| Emails envoyés aux utilisateurs sur 24 h glissantes | `EMAIL_DAILY_LIMIT` | 400 | `503`, rien n'est créé ni modifié |
| Emails du jour que les envois des administrateurs ne peuvent pas prendre, gardés pour les codes de connexion | `EMAIL_RESERVED_FOR_USERS` | un quart de `EMAIL_DAILY_LIMIT` | `503` pour l'envoi des administrateurs, vérifié en entier avant le premier email : il part vers tous les destinataires ou vers aucun |
| Comptes créés par les routes publiques sur 24 h glissantes | `NEW_ACCOUNT_DAILY_LIMIT` | 100 | `503` pour les nouvelles adresses, les comptes existants se connectent toujours |

Les autres routes sont limitées à `REQUEST_LIMIT_PER_SECOND` requêtes par seconde et par adresse IP, en moyenne sur `REQUEST_LIMIT_TIME`. Le `429` d'une limite de requêtes a le même format que les autres erreurs de l'API : une chaîne JSON (`"Too many requests, please try again later."`).

Les emails d'erreur envoyés à l'administrateur ne comptent pas : ils ont leur propre délai (`ERROR_EMAIL_COOLDOWN`). Les compteurs sont en mémoire et repartent de zéro quand l'API redémarre.

## Codes de connexion

Un code est valable `TOKEN_EXPIRATION` et accepte `LOGIN_CODE_MAX_ATTEMPTS` essais. Pour un même compte, le temps entre deux codes dépend du nombre de codes envoyés depuis la dernière connexion réussie :

| Codes déjà envoyés sans connexion réussie | Demande d'un nouveau code |
| --- | --- |
| 0 à 4 | Accepté `LOGIN_REQUEST_COOLDOWN` après le code précédent (1 min par défaut) |
| 5 à 9 | Accepté `LOGIN_REQUEST_EXTENDED_COOLDOWN` après le code précédent (10 min par défaut) |
| 10 | Aucun code n'est envoyé : passé ce même délai, la demande bloque les connexions du compte pendant `LOGIN_BLOCK_DURATION` (24 h par défaut, comme le lien de blocage des emails) et répond `403` |

Une connexion réussie remet le compteur à zéro. Un blocage aussi, qu'il vienne de ces 10 codes ou du lien de blocage : à la fin des 24 h, le cycle complet recommence. Le blocage ne ferme pas les sessions déjà ouvertes, et le lien de blocage du dernier email reste utilisable.

Contrepartie : quelqu'un qui connaît l'adresse d'un compte peut en bloquer les nouvelles connexions pendant 24 h en demandant des codes pendant un peu plus d'une heure. Un administrateur peut lever le blocage avant la fin, depuis le panel d'administration ou avec `POST /admins/user/:userId/login/unblock` : le compteur des codes repart aussi de zéro. Les routes d'administration renvoient la fin du blocage dans `login_blocked_until`.

## Jetons et journaux

- Les jetons aléatoires (demande de connexion, liens des emails) sont stockés hachés avec HMAC-SHA256, dont la clé est dérivée de `JWT_SIGNING_KEY` ; seul le code court reste haché avec Argon2. Les jetons hachés avec Argon2 avant ce changement restent acceptés. **Changer `JWT_SIGNING_KEY` invalide aussi les liens et les codes en attente.**
- Les jetons aléatoires font `TOKEN_LENGTH` caractères hexadécimaux (512 par défaut). L'API refuse de démarrer en dessous de 32 : un jeton plus court pourrait être deviné.
- Les journaux d'accès nomment l'utilisateur par son identifiant (`user-42`), jamais par son adresse email, et remplacent le jeton des liens par `[REDACTED]`.
- Sans `APP_ENV`, l'API démarre en production (codes envoyés par email, pas de Swagger).

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

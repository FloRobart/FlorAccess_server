# FlorAccess server

# Table des matière

- [FlorAccess server](#floraccess-server)
- [Table des matière](#table-des-matière)
- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
  - [Pour le développement](#pour-le-développement)
  - [Pour la production](#pour-la-production)
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

# Installation

## Pour le développement

1. Cloner le dépôt GitHub

  ```bash
  git clone https://github.com/FloRobart/FlorAccess_server.git
  ```

2. Accéder au répertoire du projet

  ```bash
  cd FlorAccess_server
  ```

3. Installer les dépendances

  ```bash
  npm install
  ```

4. Créer un fichier `.env` à la racine du projet et y ajouter les variables d'environnement nécessaires (vous pouvez vous baser sur le fichier `.env.example`)

  ```bash
  cp .env.example .env
  ```

5. Démarrer le serveur en mode développement

  ```bash
  npm run dev-docker
  ```

6. Le serveur devrait maintenant être accessible à l'adresse `http://localhost:26001`
7. Accéder à la documentation de l'API via Swagger à l'adresse `http://localhost:26001/api-docs`

## Pour la production

1. Récupérer les images Docker depuis [Docker Hub](https://hub.docker.com/u/florobart) ou depuis [GitHub Container Registry](https://github.com/FloRobart?tab=packages&repo_name=FlorAccess_server)

  ```bash
  docker pull florobart/floraccess-server:latest
  docker pull florobart/floraccess-db:latest
  ```
  
2. Créer un fichier `.env` à la racine du projet et y ajouter les variables d'environnement nécessaires (vous pouvez vous baser sur le fichier `.env.example`)

  ```bash
  touch .env
  nano .env
  ```

3. Copier le fichier `docker-compose.yml` à la racine du projet et lancer les conteneurs Docker

```bash
docker-compose up -d
```

# Auteur

FlorAccess est un projet open-source développé uniquement par [Floris Robart](https://florobart.github.io/)

# Report de bug et suggestions

Si vous découvrez une erreur, quelquelle soit, cela peut êgre une faute de frappe ou d'orthographe, une erreur de calcul, une erreur de conception, un bug qui empêche le bon fonctionnement de l'application, ou tout autre problème, Merci de me le signaler par email à l'adresse [florobart.github@gmail.com](mailto:florobart.github@gmail.com). Toutes les erreurs, quelque soit leur nature ou leur importance, seront traitées le plus rapidement possible.

Si vous avez une une **suggestion**, une **idée**, une **amélioration**, ou une **demande de fonctionnalité**, merci de me la communiquer par email à l'adresse [florobart.github@gmail.com](mailto:florobart.github@gmail.com). Toutes les suggestions, quelque soit leur nature ou leur importance, seront étudiées et prises en compte dans la mesure du possible.

# License

FlorAccess est un projet open-source sous licence [GNU General Public License v3.0](https://opensource.org/licenses/GPL-3.0).

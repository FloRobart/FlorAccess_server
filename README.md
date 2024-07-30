# Home Server Maison

## Table des matières

- [Home Server Maison](#home-server-maison)
  - [Table des matières](#table-des-matières)
  - [Présentation](#présentation)
  - [Fonctionnalités](#fonctionnalités)
  - [Images](#images)
    - [Format mobile](#format-mobile)
    - [Format ordinateur](#format-ordinateur)
  - [Technologies utilisées](#technologies-utilisées)
  - [Installation](#installation)
    - [Prérequis](#prérequis)
    - [Installation de Home Server Maison](#installation-de-home-server-maison)
    - [Lancement Home Server Maison](#lancement-home-server-maison)
  - [Autheur](#autheur)
  - [Report de bug et suggestions](#report-de-bug-et-suggestions)
  - [License](#license)

## Présentation

**Home Server Maison** est une application web de gestion de comptes personnels. Elle à créée pour servir d'entré à votre serveur personnel. C'est à dire que c'est cette application qui va gérer les comptes utilisateurs et qui affichera toutes les autres applications disponible sur votre serveur personnel. Par exemple j'ai créé une [application de gestion des finances](https://github.com/FloRobart/FinanceDashboard) qui se rattache à **Home Server Maison**.

Home Server Maison à été conçue pour être utilisé par plusieurs personnes, c'est pourquoi elle permet de créer plusieurs comptes utilisateurs. Chaque utilisateur aura donc son propre profil et ne pourra pas accéder à celui des autres sans leur mot de passe. Si vous êtes seul à utiliser l'application et que vous ne voulez pas créer de compte utilisateur cette application ne vous sera pas utile.

**Home Server Maison** n'est pas disponible en ligne, si vous voulez l'utiliser, vous devrez l'installer sur votre propre serveur. Si vous voulez créer un serveur personnel vous pouvez suivre les instructions de ma documentation sur la [création d'un serveur personnel](https://florobart.github.io/Documentations/src/doc_creation_serveur_local.html). Si vous avez déjà un serveur personnel, vous pouvez suivre les [instructions d'installation de **Home Server Maison**](#installation).

## Fonctionnalités

**Grâce à cette application vous pourrez :**

- Créer un compte utilisateur avec un nom d'utilisateur, un mot de passe, une adresse email et une image de profil.
- Se connecter à un compte utilisateur avec un mot de passe seulement.
  - Le système de connexion est basé sur le modèle de connexion de Netflix, c'est à dire que tout les comptes sont affichés à l'écran et qu'il suffit de cliquer sur le compte pour lequel on veut se connecter pour afficher le formulaire de mot de passe.
- Afficher la liste des comptes utilisateurs.
- Se déconnecter d'un compte utilisateur.
- Réinitialiser le mot de passe d'un compte utilisateur.
- Modifier les informations d'un compte utilisateur. (Nom d'utilisateur, adresse email, mot de passe et image de profil)
- Supprimer un compte utilisateur.
- Afficher le profil de l'utilisateur connecté.
- Afficher la page d'accueil de l'application qui regroupe les liens vers les autres applications de votre serveur personnel.
- Modifier les liens (lien et nom) des applications présentes sur la page d'accueil.
- Ajouter un lien d'une application sur la page d'accueil.
- Supprimer un lien d'une application sur la page d'accueil.

**Home Server Maison** est une application web open-source, elle est donc gratuite et libre d'utilisation. Vous pouvez l'utiliser, la modifier, la distribuer, la partager, etc. comme bon vous semble. Par contre, vous ne pouvez pas la vendre, ni la commercialiser, ni la distribuer sans en donner l'accès gratuit. [Voir la licence](#license).

## Images

### Format mobile

<div style="display: flex; justify-content: space-between;">
  <img src="./documentation/img/mobile/connexion.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
  <img src="./documentation/img/mobile/connexion_password.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
</div>

<div style="display: flex; justify-content: space-between;">
  <img src="./documentation/img/mobile/home_accueil.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
  <img src="./documentation/img/mobile/profil.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
</div>

### Format ordinateur

<img src="./documentation/img/desktop/connexion.png" alt="" width="100%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
<img src="./documentation/img/desktop/connexion_password.png" alt="" width="100%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
<img src="./documentation/img/desktop/home_accueil.png" alt="" width="100%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
<img src="./documentation/img/desktop/profil.png" alt="" width="100%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />

## Technologies utilisées

**Home Server Maison** est une application web développée avec les technologies suivantes :

- **Langages :**
  - PHP
  - MySQL
  - JavaScript
  - *HTML*
  - *CSS*
- **Frameworks et librairies :**
  - Laravel
  - Tailwind CSS
  - Livewire

## Installation

Pour installer **Home Server Maison** sur votre serveur, vous avez deux options :

- [Home Server Maison](#home-server-maison)
  - [Table des matières](#table-des-matières)
  - [Présentation](#présentation)
  - [Fonctionnalités](#fonctionnalités)
  - [Images](#images)
    - [Format mobile](#format-mobile)
    - [Format ordinateur](#format-ordinateur)
  - [Technologies utilisées](#technologies-utilisées)
  - [Installation](#installation)
    - [Prérequis](#prérequis)
    - [Installation de Home Server Maison](#installation-de-home-server-maison)
    - [Lancement Home Server Maison](#lancement-home-server-maison)
  - [Autheur](#autheur)
  - [Report de bug et suggestions](#report-de-bug-et-suggestions)
  - [License](#license)

### Prérequis

Pour installer **Home Server Maison** sur votre serveur, vous devez avoir les prérequis suivants :

- [Un serveur sous Linux de préférence](https://florobart.github.io/Documentations/src/doc_creation_serveur_local.html)
  - Vous pouvez également l'installer sur un ordinateur de bureau ou un hébergement web sous Linux, Windows ou MacOS, mais vous devrez adapter vous-même les instructions d'installation.
- [PHP 8.x](https://florobart.github.io/Documentations/src/doc_developpement_web.html#php) (avec les extensions suivantes)
- [Composer](https://florobart.github.io/Documentations/src/doc_developpement_web.html#composer)
- [Node.js](https://florobart.github.io/Documentations/src/doc_developpement_web.html#installation-de-nodejs---linux)
- [NPM](https://florobart.github.io/Documentations/src/doc_developpement_web.html#installation-de-npm---linux)
- [XAMPP](https://florobart.github.io/Documentations/src/doc_developpement_web.html#xampp)
  - Vous pouvez également utiliser un autre serveur web, mais vous devrez adapter vous-même les instructions d'installation.
  - Vous pouvez aussi [installer Apache](https://florobart.github.io/Documentations/src/doc_developpement_web.html#apache) et [MySQL](https://florobart.github.io/Documentations/src/doc_developpement_web.html#mysql) séparément, mais XAMPP vous facilitera grandement l'installation et la configuration de ces deux logiciels.

### Installation de Home Server Maison

- [Télécharger le code source]() de **Home Server Maison** sur votre serveur.
- Ouvrir un terminal et se placer dans le dossier de **Home Server Maison**.
- Installer les dépendances PHP

  ```bash
  composer install
  ```

- Installer les dépendances NPM

  ```bash
  npm install
  ```

- Compiler les assets

  ```bash
  npm run build
  ```

- Créer la base de données

  ```bash
  php artisan migrate
  ```

### Lancement Home Server Maison

- Lancer le serveur

  ```bash
  php artisan serve --host=0.0.0.0 --port=3000
  ```

  - Vous pouvez remplacer le port `3000` par un autre si vous le souhaitez.

- Vous pouvez maintenant accéder à l'application à l'adresse `http://<IP Serveur>:3000` (remplacer `<IP Serveur>` par l'adresse IP de votre serveur sur lequel vous avez installé **Home Server Maison**).
  - Notez qu'en suivant ces instructions, vous aurez accès à **Home Server Maison** uniquement si vous êtes connecté au même réseau que votre serveur. Si vous voulez accéder à **Home Server Maison** depuis un autre réseau, vous devrez configurer votre serveur pour qu'il soit accessible depuis l'extérieur. Mais **ATTENTION** je ne recommande pas de le faire si vous n'avez pas les compétences, car cela peut poser des problèmes de sécurité.

## Autheur

Home Server Maison est un projet open-source développé seulement par [Floris Robart](https://florobart.github.io/)

## Report de bug et suggestions

Si vous découvrez une erreur, quelquelle soit, cela peut êgre une faute de frappe ou d'orthographe, une erreur de calcul, une erreur de conception, un bug qui empêche le bon fonctionnement de l'application, ou tout autre problème, Merci de me le signaler par mail à l'adresse [florobart.github@gmail.com](mailto:florobart.github@gmail.com). Toutes les erreurs, quelque soit leur nature ou leur importance, seront traitées le plus rapidement possible.

Si vous avez une une **suggestion**, une **idée**, une **amélioration**, ou une **demande de fonctionnalité**, merci de me la communiquer par mail à l'adresse [florobart.github@gmail.com](mailto:florobart.github@gmail.com). Toutes les suggestions, quelque soit leur nature ou leur importance, seront étudiées et prises en compte dans la mesure du possible.

## License

Home Server Maison est un projet open-source sous licence [GNU General Public License v3.0](https://opensource.org/licenses/GPL-3.0).

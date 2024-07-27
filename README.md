# Home Server Maison

## Table des matières

- [Home Server Maison](#home-server-maison)
  - [Table des matières](#table-des-matières)
  - [Présentation](#présentation)
  - [Fonctionnalités](#fonctionnalités)
  - [Images](#images)
    - [Format mobile](#format-mobile)
      - [Page du Home Serveur Maison en format mobile (en cas d'installation complète de l'écosystème)](#page-du-home-serveur-maison-en-format-mobile-en-cas-dinstallation-complète-de-lécosystème)
    - [Format ordinateur](#format-ordinateur)
      - [Page du Home Serveur Maison en format desktop (en cas d'installation complète de l'écosystème)](#page-du-home-serveur-maison-en-format-desktop-en-cas-dinstallation-complète-de-lécosystème)
  - [Technologies utilisées](#technologies-utilisées)
  - [Installation](#installation)
    - [Prérequis](#prérequis)
    - [Installation de Home Server Maison](#installation-de-home-server-maison)
    - [Lancement Home Server Maison](#lancement-home-server-maison)
  - [Autheur](#autheur)
  - [Report de bug et suggestions](#report-de-bug-et-suggestions)
  - [License](#license)

## Présentation

**Home Server Maison** est une application web de gestion de finances personnelles. Elle permet de suivre ses dépenses, ses revenus, ses investissements et bien d'autre chose.

Toute-fois, cette application n'est pas déstinée à remplacer un logiciel de comptabilité professionel ni même l'application de votre banque. Elle est plutôt déstinée à vous aider à mieux gérer vos finances personnelles, à suivre vos dépenses, vos revenus, vos abonnements, vos investissements et autres.

Home Server Maison à été conçue pour être utilisé par plusieurs personnes, c'est pourquoi elle permet de créer plusieurs comptes utilisateurs. Chaque utilisateur peut donc avoir son propre compte et gérer ses finances personnelles de manière indépendante. Si vous êtes seul à utiliser l'application et que vous ne voulez pas créer de compte utilisateur, vous devrez modifier le code source (ce qui est tout à fait possible).

**Home Server Maison** n'est pas disponible en ligne, si vous voulez l'utiliser, vous devrez l'installer sur votre propre serveur. Si vous voulez créer un serveur personnel vous pouvez suivre les instructions de ma documentation sur la [création d'un serveur personnel](https://florobart.github.io/Documentations/src/doc_creation_serveur_local.html). Si vous avez déjà un serveur personnel, vous pouvez suivre les [instructions d'installation de **Home Server Maison**](#installation).

## Fonctionnalités

**Grâce à cette application vous pourrez :**

- Créer un compte utilisateur

**Home Server Maison** est une application web open-source, elle est donc gratuite et libre d'utilisation. Vous pouvez l'utiliser, la modifier, la distribuer, la partager, etc. comme bon vous semble. Par contre, vous ne pouvez pas la vendre, ni la commercialiser, ni la distribuer sans en donner l'accès gratuit.

## Images

### Format mobile

#### Page du Home Serveur Maison en format mobile (en cas d'installation complète de l'écosystème)

<div style="display: flex; justify-content: space-between;">
  <img src="./documentation/img/mobile/connexion.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
  <img src="./documentation/img/mobile/connexion_password.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
</div>

<div style="display: flex; justify-content: space-between;">
  <img src="./documentation/img/mobile/home_accueil.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
  <img src="./documentation/img/mobile/profil.png" alt="" width="45%" style="display: block; margin-left: auto; margin-right: auto;" border="1" />
</div>

### Format ordinateur

#### Page du Home Serveur Maison en format desktop (en cas d'installation complète de l'écosystème)

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
      - [Page du Home Serveur Maison en format mobile (en cas d'installation complète de l'écosystème)](#page-du-home-serveur-maison-en-format-mobile-en-cas-dinstallation-complète-de-lécosystème)
    - [Format ordinateur](#format-ordinateur)
      - [Page du Home Serveur Maison en format desktop (en cas d'installation complète de l'écosystème)](#page-du-home-serveur-maison-en-format-desktop-en-cas-dinstallation-complète-de-lécosystème)
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

### Lancement Home Server Maison

- Lancer le serveur

  ```bash
  php artisan serve --host=0.0.0.0 --port=2000
  ```

- Vous pouvez maintenant accéder à l'application à l'adresse `http://<IP Serveur>:2000` (remplacer `<IP Serveur>` par l'adresse IP de votre serveur sur lequel vous avez installé **Home Server Maison**).
  - Notez qu'en suivant ces instructions, vous aurez accès à **Home Server Maison** uniquement si vous êtes connecté au même réseau que votre serveur. Si vous voulez accéder à **Home Server Maison** depuis un autre réseau, vous devrez configurer votre serveur pour qu'il soit accessible depuis l'extérieur. Mais **ATTENTION** je ne recommande pas de le faire si vous n'avez pas les compétences, car cela peut poser des problèmes de sécurité.

## Autheur

Home Server Maison est un projet open-source développé seulement par [Floris Robart](https://florobart.github.io/)

## Report de bug et suggestions

Si vous découvrez une erreur, quelquelle soit, cela peut êgre une faute de frappe ou d'orthographe, une erreur de calcul, une erreur de conception, un bug qui empêche le bon fonctionnement de l'application, ou tout autre problème, Merci de me le signaler par mail à l'adresse [florisrobart.pro@gmail.com](mailto:florisrobart.pro@gmail.com). Toutes les erreurs, quelque soit leur nature ou leur importance, seront traitées le plus rapidement possible.

Si vous avez une une **suggestion**, une **idée**, une **amélioration**, ou une **demande de fonctionnalité**, merci de me la communiquer par mail à l'adresse [florisrobart.pro@gmail.com](mailto:florisrobart.pro@gmail.com). Toutes les suggestions, quelque soit leur nature ou leur importance, seront étudiées et prises en compte dans la mesure du possible.

## License

Home Server Maison est un projet open-source sous licence [GNU General Public License v3.0](https://opensource.org/licenses/GPL-3.0).

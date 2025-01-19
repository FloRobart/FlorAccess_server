{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'incription -->
@extends('layouts.page_template')
@section('title')
    Présentation des outils
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Présentation des outils'])

<!-- Messages d'erreur et de succès -->
<div class="colCenterContainer mt-8 px-4">
    @include('components.information-message')
</div>

<!-- Formulaire d'inscription -->
<section class="colCenterContainer gap-y-10 bgPage px-6 sm:px-16 mb-20">
    <div class="smallColStartContainer">
        <div class="smallRowStartContainer">
            <img src="{{ asset('favicon.ico') }}" alt="Logo de FlorAccess" class="fontSizeIcons">
            <h1 class="titleTextBleuLogo ml-4">FlorAccess</h1>
        </div>
        <div class="smallColStartContainer space-y-6">
            <p class="normalText text-center">FlorAccess vous permet de gérer vos accès à vos différents outils en ligne. C'est-à-dire qu'en vous connectant à FlorAccess, vous pourrez accéder à vos outils compatibles comme {{ env('NAME_TOOLS_1') }} et {{ env('NAME_TOOLS_2') }} sans avoir à vous connecter à chaque fois.</p>
            <p class="normalText text-center">Vous pourrez également ajouter des sites web à votre liste d'outils, un peu comme des favoris, pour y accéder plus rapidement.</p>
        </div>
    </div>

    <div class="smallColStartContainer">
        <div class="smallRowStartContainer">
            <img src="{{ env('URL_TOOLS_1') . '/favicon.ico' }}" alt="Logo de {{ env('NAME_TOOLS_1') }}" class="fontSizeIcons">
            <h1 class="titleTextBleuLogo ml-4">{{ env('NAME_TOOLS_1') }}</h1>
        </div>
        <div class="smallColStartContainer space-y-6">
            <p class="normalText text-center">{{ env('NAME_TOOLS_1') }} est un gestionnaire de patrimoine financier. Cette application vous servira à suivre l'argent qui entre et l'argent qui sort chaque mois pour vous permettre de mieux suivre où passe votre argent.</p>
            <p class="normalText text-center">Attention, cette application ne remplace pas votre application bancaire habituelle et ne permet pas de suivre le rendement de vos investissements. Le but réel de cette application, c'est de garder une trace de vos dépenses, vos investissements et autre et de vous montrer des données qui vous serviront à vous dire si vous dépensez trop.</p>
            <p class="normalText text-center">Il faut voir cette application comme une aide à la gestion de votre argent qui mettra en lumière les informations importantes pour vous aider à mieux gérer votre argent.</p> 
        </div>
    </div>

    <div class="smallColStartContainer">
        <div class="smallRowStartContainer">
            <img src="{{ env('URL_TOOLS_2') . '/favicon.ico' }}" alt="Logo de {{ env('NAME_TOOLS_1') }}" class="fontSizeIcons">
            <h1 class="titleTextBleuLogo ml-4">{{ env('NAME_TOOLS_2') }}</h1>
        </div>
        <div class="smallColStartContainer space-y-6">
            <p class="normalText text-center">{{ env('NAME_TOOLS_2') }} est un gestionnaire de mot passe entièrement sécurisé. Il respecte de standard de sécurité de haut niveau, habituellement utilisé dans des applications sensibles telles que des logiciels militaires.</p>
            <p class="normalText text-center">Vos mots de passe sont protégés contre le vol de données, c'est-à-dire que même en cas de piratage du serveur, personne ne pourras récupérer vos mots de passe grâce à un système de sécurité très particulier qui utilise plusieurs sources de données dont certaines ne sont jamais enregistrées.</p>
            <p class="normalText text-center">Le contrecoup de cette sécurité maximale, c'est que si vous perdez le mot de passe (appeler clé d'accès) pour accéder à vos comptes enregistrés sur Lys Secure, il sera impossible récupérer vos mots de passe.</p>
            <p class="normalText text-center">Il est donc très important de bien garder votre clé d'accès en sécurité et de ne jamais la perdre. Si vous la perdez, vous devrez recréer un compte et réenregistrer tous vos mots de passe.</p>
            <p class="normalText text-center">L'autre petit inconvénient lié à la sécurité, c'est qu'il n'est pas possible de saisir automatiquement vos mots de passe sur les sites web. Il faudra donc les copier coller manuellement, mais rassurer vous ça se fait en trois cliques.</p>
            <p class="normalText text-center"><b>Petite astuce :</b> lors de la modification d'un compte, si vous ne voulez pas changer le mot de passe, il suffit de laisser le champs de mot de passe vide et il ne sera pas modifié.</p>
            <p class="normalText text-center"><b>Petite astuce :</b> vous pouvez créer un compte, puis l'exporter pour avoir le modèle de fichier à remplir pour ajouter vos mots de passe en important un fichier texte.</p>
        </div>
    </div>

    <div class="smallColStartContainer mt-16">
        <p class="normalText text-center font-bold">Si vous voulez des détails techniques, que vous avez des questions ou des problèmes, n'hésitez pas à me contacter via le <a href="{{ route('contact') }}" class="link colorFontBleuLogo">formulaire de contact</a></p>
    </div>


    <div class="smallRowStartContainer mt-10">
        <a href="{{ $_SERVER['HTTP_REFERER'] ?? route('public.accueil') }}" class="buttonForm">{{ $_SERVER['HTTP_REFERER'] ? 'Retour' : 'Accueil' }}</a>

        @if ($_SERVER['HTTP_REFERER'] != null)
            <a href="{{ route('public.accueil') }}" class="buttonForm ml-10">Accueil</a>
        @endif
    </div>
</section>
@endsection
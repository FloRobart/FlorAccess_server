{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'accueil -->
@extends('layouts.page_template')
@section('title')
    Choix de l'outil
@endsection

@section('content')
<!-- Titre de la page -->
<livewire:page-title :title="'Que voulez-vous faire ?'" />

<!-- Messages d'erreur et de succès -->
<div class="colCenterContainer mt-8 px-4 my-32">
    @if ($errors->any())
        <div class="rowCenterContainer">
            <ul>
                @foreach ($errors->all() as $error)
                    <li class="normalTextError text-center">{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif
    <livewire:information-message />
</div>


<!-- Affichage des différents profils -->
<section class="colCenterContainer gap-y-10 bgPage mb-[21rem] min-[400px]:mb-68 md:mb-[30rem] lg:mb-[21rem] xl:mb-52">
    <a href="http://192.168.1.250:2001" class="buttonForm">Gestionnaire de mot de passe</a>
    <a href="http://192.168.1.250:2002" class="buttonForm">Tableau de bord des finances</a>
    <a href="http://192.168.1.250:2003" class="buttonForm">Système de sauvegarde (Cloud)</a>
</section>
@endsection

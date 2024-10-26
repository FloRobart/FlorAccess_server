{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'envoi de mail de réinitialisation de mot de passe -->
@extends('layouts.page_template')
@section('title')
    Demande de réinitialisation de mot de passe
@endsection

@section('content')
{{-- Enregistrement du log --}}
{{ App\Http\Controllers\LogController::addLog('Affichage de la page de saisie d\'email pour la réinitialisation du mot de passe'); }}

<!-- Titre de la page -->
<livewire:page-title :title="'Demande de réinitialisation de mot de passe'" />

<!-- Messages d'erreur et de succès -->
<div class="colCenterContainer mt-8 px-4">
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

<!-- Formulaire de demande de réinitialisation de mot de passe -->
<section class="bgPage py-6 lg:py-12 px-4 mx-auto max-w-screen-md">
    <form action="{{ route('resetPassword.emailRequestSave') }}" method="POST" class="space-y-10">
        @csrf
        <!-- Adresse email -->
        <div>
            <label for="email" class="labelForm">Adresse email <livewire:asterisque /></label>
            <input name="email" type="email" id="email" autocomplete="email" class="inputForm" placeholder="nom@mail.com" required>
        </div>

        <!-- bouton de validation -->
        <div class="smallRowStartContainer">
            <button type="submit" class="buttonForm">Envoyer le mail de réinitialisation</button>
        </div>
    </form>

    <!-- précision -->
    <div class="smallRowStartContainer mt-3">
        <livewire:asterisque />
        <span class="smallText ml-1">Champs obligatoires</span>
    </div>
</section>
@endsection

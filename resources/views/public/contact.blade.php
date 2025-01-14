{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page de contact -->
@extends('layouts.page_template')
@section('title')
    {{ ucfirst($subject) }}
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => ucfirst($subject) ])


<!-- Messages d'erreur et de succès -->
<div class="colCenterContainer mt-8 px-4">
    @include('components.information-message')
</div>


<!-- Formulaire de contact -->
<section class="bgPage py-8 lg:py-16 px-4 mx-auto max-w-screen-md">
    <form action="{{ route('contactSave') }}" method="POST" class="space-y-8">
        @csrf
        <!-- Subject -->
        <input type="hidden" name="subject" value="{{ $subject }}">

        <!-- Nom -->
        <div>
            <label for="name" class="normalText font-medium mb-2">Votre nom @include('components.asterisque')</label>
            <input type="text" id="name" name="name" class="inputForm" placeholder="Donner un titre à votre mail" maxlength="980" required value="{{ auth()->check() ? auth()->user()->name : old('name') }}">
        </div>

        <!-- Adresse email -->
        <div>
            <label for="email" class="normalText font-medium mb-2">Votre email @include('components.asterisque')</label>
            <input type="email" id="email" name="email" class="inputForm" autocomplete="email" placeholder="nom@mail.com" minlength="3" maxlength="320" value="{{ auth()->check() ? auth()->user()->email : old('email') }}" required>
        </div>

        <!-- Message -->
        <div class="sm:col-span-2">
            <label for="message" class="normalText font-medium mb-2">Votre message @include('components.asterisque')</label>
            <textarea id="message" name="message" rows="6" class="inputForm" placeholder="Écrivez votre message..." minlength="10" value="{{ old('message') }}"></textarea>
        </div>

        <!-- Bouton d'envoi -->
        <button type="submit" class="buttonForm" title="Envoyer">Envoyer</button>
    </form>

    <!-- précision -->
    <div class="smallRowStartContainer mt-3">
        @include('components.asterisque')
        <span class="smallText ml-1">Champs obligatoires</span>
    </div>
</section>
@endsection
{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'incription -->
@extends('layouts.page_template')
@section('title')
    Vérification de l'email
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Vérification de l\'email'])

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
    @include('components.information-message')

    <!-- Message d'information -->
    <div class="rowCenterContainer">
        <ul>
            <li class="normalTextBleuLogo text-center">Un mail de vérification vous a été envoyé à l'adresse {{ Auth::user()->email }}, veuillez vérifier votre boite mail</li>
        </ul>
    </div>
</div>

<!-- Formulaire d'inscription -->
<section class="bgPage">
    <div class="py-6 lg:py-12 px-4 mx-auto max-w-screen-md">
        <form action="{{ route('verification.email.save') }}" method="POST" class="space-y-10">
            @csrf
            <!-- Code de vérification à 6 chiffres -->
            <div class="rowCenterContainer space-x-4">
                @for ($i = 1; $i <= 6; $i++)
                    <input id="code{{ $i }}" name="code{{ $i }}" type="text" min="0" max="9" maxlength="1" size="1" pattern="[0-9]{1}"
                     autocomplete="off" class="smallRowCenterContainer text-center titleTextBleuLogo font-bold rounded-xl" placeholder="0" required value="{{ old('code' . $i) }}" autofocus>
                @endfor
            </div>

            <!-- bouton de validation -->
            <div class="smallRowCenterContainer">
                <button type="submit" class="buttonForm mt-10">Valider</button>
            </div>
        </form>
    </div>
</section>
@endsection

@section('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function () {
        lengthNumber = 6;
        for (let i = 1; i <= lengthNumber; i++) {
            document.getElementById('code' + i).addEventListener('input', function() {
                /* Fonction pour bloquer la saisie de lettres */
                this.value = this.value.replace(/[^0-9]/g, '');

                /* Fonction pour passer au champ suivant */
                if (i < lengthNumber) {
                    document.getElementById('code' + (i + 1)).focus();
                } else {
                    document.getElementsByTagName('button')[0].focus();
                }
            });
        }
    });
</script>
@endsection
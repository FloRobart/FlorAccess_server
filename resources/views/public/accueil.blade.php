{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'accueil -->
@extends('layouts.page_template')
@section('title')
    Choix profil
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Qui êtes vous ?'])

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
</div>


<!-- Affichage des différents profils -->
<section class="flex w-full bgPage mb-[21rem] min-[400px]:mb-68 md:mb-[30rem] lg:mb-[21rem] xl:mb-52">
    <div class="flex w-full py-6 lg:py-12 px-2 min-[400px]:px-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-8 w-full justify-center items-start">
            @foreach ($profils as $profil)
                <div class="smallColCenterContainer">
                    <button onclick="password_modal('{{ $profil->email }}')" id="profil_{{ $profil->id }}" class="smallColCenterContainer group gap-y-2">
                        <div class="smallColCenterContainer bg-white rounded-xl overflow-hidden shadow-lg w-36 h-36 min-[400px]:w-44 min-[400px]:h-44 lg:w-52 lg:h-52 xl:w-72 xl:h-72">
                            <div class="flex justify-center items-center group-hover:bigScale">
                                @if ($profil->imgProfil != null)
                                    <img class="w-full h-full object-cover" src="data:image/png;base64,{{ $profil->imgProfil }}" alt="Image de profil">
                                @else
                                    <svg class="w-full colorFontBleuFonce" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0a8.966 8.966 0 0 1 12 0 8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    </svg>
                                @endif
                            </div>
                        </div>
                        <span class="w-full smallText text-center group-hover:text-[#5B1010] font-bold">{{ $profil == null ? 'Ajouter un profil' : $profil->name }}</span>
                    </button>
                </div>
            @endforeach

            <!-- Ajout d'un profil -->
            <div class="smallColCenterContainer">
                <a href="{{ route('inscription') }}" class="smallColCenterContainer group gap-y-2">
                    <div class="smallColCenterContainer bg-white rounded-xl shadow-lg w-36 h-36 min-[400px]:w-44 min-[400px]:h-44 lg:w-52 lg:h-52 xl:w-72 xl:h-72">
                        <div class="flex justify-center items-center group-hover:bigScale">
                            <svg class="w-full colorFontBleuFonce" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>
                    </div>
                    <span class="w-full smallText text-center group-hover:text-[#5B1010] font-bold">Ajouter un profil</span>
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Modal -->
@include('components.password-modal', ['email' => '$email'])

{{-- Enregistrement du log --}}
{{ App\Http\Controllers\LogController::addLog('Affichage de la page d\'accueil public (pour se connecter ou s\'inscrire)'); }}
@endsection


@section('scripts')
<script src="{{ asset('js/showPassword.js') }}"></script>

<script>
    function password_modal(email) {
        document.getElementById('password_modal').showModal();
        document.getElementById('email').value = email;
    }
</script>
@endsection

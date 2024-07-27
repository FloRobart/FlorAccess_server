{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florisrobart.pro@gmail.com>
--}}

<!-- Page d'accueil -->
@extends('layouts.page_template')
@section('title')
    Profil
@endsection

@section('content')
<!-- Titre de la page -->
<livewire:page-title :title="'Profil'" />

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

    <div id="alert-message" class="flex justify-center items-center w-full hidden">
        <span class="normalTextAlert text-center">Pensez à souvegarder vos modifications en appuyant sur <b class="uppercase">ENTRER</b> ou sur le <b>bouton de validation</b></span>
    </div>
</div>

<!-- Formulaire d'inscription -->
<section class="bgPage">
    <div class="py-6 lg:py-12 px-2 min-[400px]:px-4 mx-auto max-w-screen-md">
        <form action="{{ route('profilSave') }}" method="POST" enctype="multipart/form-data" class="space-y-4">
            @csrf
            <!-- Photo de profil -->
            <div class="pb-20">
                <div class="smallColCenterContainer gap-y-6">
                    <div class="shrink-0">
                        <img id='preview_img' class="bigIcons object-cover rounded-xl" src="data:image/png;base64,{{ auth()->user()->imgProfil }}" alt="Image de profil" />
                        <span class="sr-only">Photo de profil</span>
                    </div>
                    <input type="file" id="profil_image" name="profil_image" accept="image/*" autocomplete="off" onchange="loadFile(event)" class="block w-fot font fontSizeSmall colorFont file:text-white mt-4 md:mt-0 file:py-2 file:px-5 file:rounded-full file:border-0 file:bg-[#3232FF] hover:file:bg-[#0000CC] hover:file:cursor-pointer focus:file:scale-105"/>
                </div>
            </div>

            <!-- Nom -->
            <div class="smallRowStartContainer">
                <label for="name" class="labelForm">Pseudo<span class="ml-1 min-[350px]:ml-2 sm:ml-4 mr-1 sm:mr-3">:</span></label>
                <input name="name" id="name" minlength="3" maxlength="18" autocomplete="off" title="Cliquez pour modifier votre pseudo" class="hiddenInputForm" onfocus="showButton()" value="{{ auth()->user()->name }}">
            </div>

            <!-- Adresse email -->
            <div class="smallRowStartContainer">
                <label for="email" class="labelForm">Email<span class="ml-1 min-[350px]:ml-2 sm:ml-4 mr-1 sm:mr-3">:</span></label>
                <input name="email" id="email" autocomplete="email" title="Cliquez pour modifier votre email" class="hiddenInputForm" onfocus="showButton()" value="{{ auth()->user()->email }}">
            </div>

            <!-- Mot de passe -->
            <div class="smallRowStartContainer">
                <label for="password" class="labelForm">Mot de passe<span class="ml-1 min-[350px]:ml-2 sm:ml-4 mr-1 sm:mr-3">:</span></label>
                <div class="relative">
                    <input name="password" id="password" type="password" minlength="8" maxlength="20" autocomplete="new-password" title="Cliquez pour changer de mot de passe" class="hiddenInputForm" placeholder="Nouveau mot de passe" onfocus="showPasswordInput()" value="">
                    <button type="button" class="absolute top-0 end-0 p-1 rounded-e-md" onclick="clickSvgPassword()">
                        <!-- Icône eye fermé -->
                        <svg id="svgEyeClose1" class="hidden colorFont fontSizeIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>

                        <!-- Icône eye ouvert -->
                        <svg id="svgEyeOpen1" class="hidden colorFont fontSizeIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- bouton de validation -->
            <div class="smallRowStartContainer">
                <button id="saveButton" type="submit" class="buttonForm hidden my-12">Valider les modifications</button>
            </div>
        </form>
    </div>
</section>

<!-- bouton de déconnexion -->
<div class="rowCenterContainer my-6 lg:my-10">
    <a href="{{ route('deconnexion') }}" class="buttonForm">Déconnexion</a>
</div>

<!-- Bouton de suppression du compte -->
<div class="rowCenterContainer my-14 lg:my-20">
    <a onclick="return confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')" href="{{ route('supprimerCompte') }}" class="alertButtonForm">Supprimer mon compte</a>
</div>
@endsection

@section('scripts')
<script>
    /* Affiche le bouton de validation du formulaire */
    function showButton()
    {
        document.getElementById('saveButton').classList.remove('hidden');
        document.getElementById('alert-message').classList.remove('hidden');
    }

    /* Affiche le bouton de validation du formulaire et le bouton d'affichage du mot de passe */
    function showPasswordInput()
    {
        this.showButton();
        if (document.getElementById('password').type === 'password')
        {
            document.getElementById('svgEyeClose1').classList.remove('hidden');
            document.getElementById('svgEyeOpen1').classList.add('hidden');
        }
        else
        {
            document.getElementById('svgEyeClose1').classList.add('hidden');
            document.getElementById('svgEyeOpen1').classList.remove('hidden');
        }
    }

    /* Affiche ou masque le mot de passe puis remet le focus sur le champ de saisie */
    function clickSvgPassword()
    {
        let password = document.getElementById('password');
        password.focus();

        if (password.type === 'password')
        {
            password.type = 'text';
            document.getElementById('svgEyeClose1').classList.add('hidden');
            document.getElementById('svgEyeOpen1').classList.remove('hidden');
        }
        else
        {
            password.type = 'password';
            document.getElementById('svgEyeClose1').classList.remove('hidden');
            document.getElementById('svgEyeOpen1').classList.add('hidden');
        }
    }
</script>

<!-- Script pour afficher l'image de profil -->
<script>
    var loadFile = function(event)
    {
        var input = event.target;
        var file = input.files[0];
        var type = file.type;
        var previewImage = document.getElementById('preview_img');
        

        if (file === undefined)
        {
            previewImage.src = "{{ asset('img/product_placeholder.png') }}";
            return;
        }
        else
        {
            if (type.match('image.*') === null)
            {
                alert('Le fichier choisi n\'est pas une image');
                return;
            }

            
        }
        previewImage.src = URL.createObjectURL(event.target.files[0]);
        previewImage.onload = function() {
            URL.revokeObjectURL(output.src) // free memory
        }

        showButton();
    };
</script>
@endsection

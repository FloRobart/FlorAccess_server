{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<header id="top" class="colCenterContainer space-y-6 pt-4 bgBleuSombre">
    <!-- Partie haute du header -->
    <div class="rowBetweenContainer">
        <!-- Logo + lien vers la page d'accueil -->
        <div class="smallRowCenterContainer mx-6 min-[400px]:mx-14">
            <a href="{{ route('private.accueil') }}" class="logo">
                <img class="w-20 sm:w-28" src="{{ asset('favicon.ico') }}" alt="Logo">
            </a>
        </div>

        <!-- Profil -->
        <div class="smallRowCenterContainer mx-6 min-[400px]:mx-14">
            @if (auth()->check())
                <a href="{{ route('profil') }}" class="colorFontReverse hoverText" title="Profil">
            @endif

            <div class="smallRowCenterContainer">
                <!-- Icône du profil -->
                @if (auth()->check())
                    @if (auth()->user()->imgProfil != null)
                        <img class="w-12 h-12 lg:w-16 lg:h-16 xl:w-20 xl:h-20 overflow-hidden rounded-full" src="data:image/png;base64,{{ auth()->user()->imgProfil }}" alt="Image de profil">
                    @else
                        <svg class="normalIcons colorFontBleuLogo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    @endif
                @endif

                @if (auth()->check())
                    <span class="normalTextReverse ml-2 flex">
                        {{ auth()->user()->name }}
                    </span>
                @else
                    <!-- Inscription -->
                    <div class="smallRowCenterContainer">
                        <a href="{{ route('inscription') }}" class="hover:underline colorFontReverse" title="Inscription">
                            <span class="smallTextReverse ml-2 flex">Inscription</span>
                        </a>
                    </div>
                @endif
            </div>

            @if (auth()->check())
                </a>
            @endif
        </div>
    </div>

    <!-- Partie basse du header -->
    <div class="rowBetweenContainer bgBleuFonce2 py-3">
        <!-- Fil d'ariane -->
        <div id="breadcrumb" class="rowStartContainer ml-20">
            @if (auth()->check())
                <!-- Accueil -->
                <a href="{{ route('private.accueil') }}" class="smallTextReverse">Accueil</a>

                <!-- Profil -->
                @if (str_contains(strtolower(URL::current()), 'profil'))
                    @include('components.breadcrumb-link', ['name' => 'Profil', 'link' => route('profil')])
                @endif

                <!-- Admin -->
                @if (str_contains(strtolower(URL::current()), 'admin'))
                    @include('components.breadcrumb-link', ['name' => 'Admin', 'link' => route('admin.accueil')])
                @endif

                <!-- Logs -->
                @if (str_contains(strtolower(URL::current()), 'logs'))
                    @include('components.breadcrumb-link', ['name' => 'Logs', 'link' => route('admin.logs')])
                @endif

                <!-- log détails -->
                @if (str_contains(strtolower(URL::current()), 'logs/details'))
                    @include('components.breadcrumb-link', ['name' => 'Détails', 'link' => '#'])
                @endif

                <!-- Adresse IP -->
                @if (str_contains(strtolower(URL::current()), 'adresse_ip'))
                    @include('components.breadcrumb-link', ['name' => 'Adresse IP', 'link' => route('admin.adresse_ip')])
                @endif

                <!-- Adresse IP Token -->
                @if (str_contains(strtolower(URL::current()), 'adresse_ip_token'))
                    @include('components.breadcrumb-link', ['name' => 'Adresse IP Token', 'link' => route('admin.adresse_ip_token')])
                @endif

                <!-- Utilisateurs -->
                @if (str_contains(strtolower(URL::current()), 'users'))
                    @include('components.breadcrumb-link', ['name' => 'Utilisateur', 'link' => route('admin.users')])
                @endif

                <!-- Outils -->
                @if (str_contains(strtolower(URL::current()), 'tools'))
                    @include('components.breadcrumb-link', ['name' => 'Outils', 'link' => route('admin.tools')])
                @endif
            @else
                <!-- Connexion -->
                <a href="{{ route('login') }}" class="smallTextReverse">Connexion</a>

                <!-- Inscription -->
                @if (str_contains(strtolower(URL::current()), 'inscription'))
                    @include('components.breadcrumb-link', ['name' => 'Inscription', 'link' => route('inscription')])
                @endif

                <!-- Réinitialisation du mot de passe -->
                @if (str_contains(strtolower(URL::current()), 'resetPassword'))
                    @include('components.breadcrumb-link', ['name' => 'Réinitialisation du mot de passe', 'link' => route('resetPassword')])
                @endif

                <!-- Nouveau mot de passe -->
                @if (str_contains(strtolower(URL::current()), 'resetPasswordSave'))
                    @include('components.breadcrumb-link', ['name' => 'Nouveau mot de passe', 'link' => route('password.reset')])
                @endif
            @endif
        </div>
    </div>
</header>

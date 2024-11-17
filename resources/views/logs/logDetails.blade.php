{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'accueil -->
@extends('layouts.page_template')
@section('title')
    Détails log {{ $log->id }}
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Détail du log n°' . $log->id])

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
    @include('components.information-message')
</div>


<!-- Affichage du log -->
<section class="colStartContainer space-y-12 mt-4 px-6 mb-32 bgPage">
    <div class="colStartContainer">
        <!-- Informations du log -->
        <div class="colStartContainer space-y-3 px-3 sm:px-6">
            <span class="w-full normalText">id : <span class="normalTextBleuLogo font-bold">{{ $log->id }}</span></span>
            <span class="w-full normalText">id utilisateur : <span class="normalTextBleuLogo font-bold">{{ $log->user_id ?? null }}</span></span>
            <span class="w-full normalText">Nom utilisateur : <span class="normalTextBleuLogo font-bold">{{ $log->user_id != null ? App\Models\User::find($log->user_id)->name : 'Invité' }}</span></span>
            <span class="w-full normalText">Email utilisateur : <span class="normalTextBleuLogo font-bold">{{ $log->user_id != null ? App\Models\User::find($log->user_id)->email : 'Invité' }}</span></span>
            <span class="w-full normalText">IP utilisateur : <span class="normalTextBleuLogo font-bold">{{ $log->ip }}</span></span>
            <span class="w-full normalText">Hôte : <span class="normalTextBleuLogo font-bold">{{ $log->host }}</span></span>
            <span class="w-full normalText">Page d'origine : <span class="normalTextBleuLogo font-bold">{{ $log->link_from }}</span></span>
            <span class="w-full normalText">Page de destination : <span class="normalTextBleuLogo font-bold">{{ $log->link_to }}</span></span>
            <span class="w-full normalText">Méthode : <span class="normalTextBleuLogo font-bold">{{ $log->method_to }}</span></span>
            <span class="w-full normalText">User agent : <span class="normalTextBleuLogo font-bold">{{ $log->user_agent }}</span></span>
            <span class="w-full normalText">Message : <span class="normalTextBleuLogo font-bold">{{ $log->message }}</span></span>
            <span class="w-full normalText flex">Statut : 
                @if (!$log->status)
                    <svg class="smallSizeIcons fontColorValid ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                @else
                    <svg class="smallSizeIcons fontColorError ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                @endif
            </span>
            <span class="w-full normalText">Date : <span class="normalTextBleuLogo font-bold">{{ strftime('%d %B %Y à %T', strtotime($log->created_at)) }}</span></span>
        </div>
    </div>
</section>

{{-- Enregistrement du log --}}
{{ App\Http\Controllers\LogController::addLog('Affichage de la page du log n°' . $log->id); }}
@endsection

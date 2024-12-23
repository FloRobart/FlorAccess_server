{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'incription -->
@extends('layouts.page_template')
@section('title')
    Admin
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Admin'])

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

<!-- Contenue de la page -->
<section class="colCenterContainer gap-y-10 bgPage mb-[21rem] min-[400px]:mb-68 md:mb-[30rem] lg:mb-[21rem] xl:mb-52">
    <div class="colCenterContainer lg:rowCenterContainer gap-4">
        <a href="{{ route('admin.logs') }}" class="buttonForm">Logs</a>
        <a href="{{ route('admin.adresse_ip') }}" class="buttonForm">Adresse IP</a>
        <a href="{{ route('admin.adresse_ip_token') }}" class="buttonForm">Adresse IP Token</a>
        <a href="{{ route('admin.users') }}" class="buttonForm">Utilisateurs</a>
        <a href="{{ route('admin.tools') }}" class="buttonForm">Outils</a>
    </div>
</section>
@endsection
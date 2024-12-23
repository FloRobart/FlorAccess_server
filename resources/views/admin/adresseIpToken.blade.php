{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'incription -->
@extends('layouts.page_template')
@section('title')
    Adresse IP Token
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Adresse IP Token'])

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
<section class="colCenterContainer space-y-12 mt-4 px-6 mb-32 bgPage">
    <!-- Information générale -->
    <div class="colCenterContainer">
        <h2 class="w-full bigTextBleuLogo text-center mb-3">Information générale</h2>
        <div class="rowCenterContainer">
            <span class="normalText">Nombre d'adresse IP Token total : <span class="normalTextBleuLogo font-bold">{{ $nbAdresseIpToken }}</span></span>
        </div>
        <div class="rowCenterContainer">
            <span class="normalText">Nombre d'adresse IP Token par page : <span class="normalTextBleuLogo font-bold">{{ $perPage }}</span></span>
        </div>
    </div>

    <!-- Barre de séparation -->
    @include('components.horizontal-separation')

    <!-- Liste des adresses IP -->
    <div class="colCenterContainer">
        <h2 class="w-full bigTextBleuLogo text-center mb-3">Détails de la table Adresse IP Token</h2>
        <table class="w-full mt-2">
            <!-- Entête du tableau -->
            <thead class="w-full">
                <tr class="tableRow smallText text-center font-bold">
                    @php request()->get('order') == 'asc' ? $order = 'desc' : $order = 'asc'; @endphp
                    <th class="tableCell">Date</th>
                    <th class="tableCell">Email</th>
                    <th class="tableCell">Adresse IP</th>
                </tr>
            </thead>

            <!-- Contenue du tableau -->
            <tbody class="w-full normalText">
                @if (isset($adresseIpTokens))
                    @foreach ($adresseIpTokens as $adresseIpToken)
                        <tr class="tableRow smallText text-center">
                            <!-- Date de l'ajout de l'adresse IP Token -->
                            <td class="tableCell">{{ strftime('%e/%m/%Y', strtotime($adresseIpToken->created_at)) }}</td>
                            
                            <!-- Email associé à l'adresse IP Token -->
                            <td class="tableCell">{{ $adresseIpToken->email }}</td>

                            <!-- Adresse IP de l'utilisateur -->
                            <td class="tableCell">{{ $adresseIpToken->adresse_ip }}</td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>
    </div>

    {{ $adresseIpTokens->links('pagination::tailwind') }}
</section>
@endsection
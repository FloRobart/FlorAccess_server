{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'incription -->
@extends('layouts.page_template')
@section('title')
    Adresse IP
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Adresse IP'])

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
            <span class="normalText">Nombre d'adresse IP total : <span class="normalTextBleuLogo font-bold">{{ $nbAdresseIp }}</span></span>
        </div>
        <div class="rowCenterContainer">
            <span class="normalText">Nombre d'adresse IP par page : <span class="normalTextBleuLogo font-bold">{{ $perPage }}</span></span>
        </div>
    </div>

    <!-- Barre de séparation -->
    @include('components.horizontal-separation')

    <!-- Liste des adresses IP -->
    <div class="colCenterContainer">
        <h2 class="w-full bigTextBleuLogo text-center mb-3">Détails de la table Adresse IP</h2>
        <table class="w-full mt-2">
            <!-- Entête du tableau -->
            <thead class="w-full">
                <tr class="tableRow smallText text-center font-bold">
                    @php request()->get('order') == 'asc' ? $order = 'desc' : $order = 'asc'; @endphp
                    <th class="tableCell">Date</th>
                    <th class="tableCell">ID</th>
                    <th class="tableCell">Utilisateur</th>
                    <th class="tableCell">Adresse IP</th>
                    <th class="tableCell">Authorisé</th>
                </tr>
            </thead>

            <!-- Contenue du tableau -->
            <tbody class="w-full normalText">
                @if (isset($adresseIps))
                    @foreach ($adresseIps as $adresseIp)
                        <tr class="tableRow smallText text-center">
                            <!-- Date de l'ajout de l'adresse IP -->
                            <td class="tableCell">{{ strftime('%e/%m/%Y', strtotime($adresseIp->created_at)) }}</td>
                            
                            <!-- ID de l'adresse IP -->
                            <td class="tableCell">{{ $adresseIp->id }}</td>

                            <!-- Utilisateur -->
                            @php $user = $users->where('id', $adresseIp->user_id)->first(); @endphp
                            <td class="tableCell @if ($user->email == env('ADMIN_EMAIL')) fontColorError @endif">{{ "$user->id - $user->name" }}</td>

                            <!-- Adresse IP -->
                            <td class="tableCell @if ($adresseIp->adresse_ip == request()->ip()) fontColorValid @endif">{{ $adresseIp->adresse_ip }}</td>

                            <!-- Autorisation de l'adresse IP -->
                            <td class="tableCell rowCenterContainer @if ($adresseIp->est_bannie) fontColorValid @else fontColorError @endif">
                                @if (!$adresseIp->est_bannie)
                                    <svg class="smallSizeIcons fontColorValid" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                @else
                                    <svg class="smallSizeIcons fontColorError" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>

        <!-- Pagination -->
        <div class="colCenterContainer mt-8">
            {{ $adresseIps->links('pagination::tailwind') }}
        </div>

        <!-- Formulaire d'ajout d'une adresse IP -->
        <div class="colCenterContainer mt-8">
            <h2 class="w-full bigTextBleuLogo text-center mb-3">Ajouter une adresse IP</h2>
            <form action="{{ route('admin.adresse_ipSave') }}" method="POST" class="smallColCenterContainer sm:w-[55%]">
                @csrf
                <div class="colCenterContainer">
                    <!-- Adresse IP -->
                    <input name="ip" type="text" minlength="7" maxlength="15" size="15" class="inputForm" required>

                    <!-- Utilisateur -->
                    <select name="user_id" class="inputForm mt-4">
                        <option value="" selected disabled>Utilisateur</option>
                        @foreach ($users as $user)
                            <option value="{{ $user->id }}">{{ "$user->id - $user->name" }}</option>
                        @endforeach
                    </select>

                    <!-- Bannir l'adresse IP -->
                    <div class="rowCenterContainer mt-4 space-x-4">
                        <label for="est_bannie" class="normalText ml-2 link cursor-pointer">Bannir l'adresse IP</label>
                        <input id="est_bannie" name="est_bannie" type="checkbox" class="size-6 cursor-pointer">
                    </div>

                    <button type="submit" class="buttonForm font-bold mt-4">Ajouter</button>
                </div>
            </form>
        </div>
    </div>
</section>
@endsection
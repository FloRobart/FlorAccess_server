{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'incription -->
@extends('layouts.page_template')
@section('title')
    Tools
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Tools'])

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
            <span class="normalText">Nombre d'outils total : <span class="normalTextBleuLogo font-bold">{{ $nbTool }}</span></span>
        </div>
        <div class="rowCenterContainer">
            <span class="normalText">Nombre d'outils par page : <span class="normalTextBleuLogo font-bold">{{ $perPage }}</span></span>
        </div>
    </div>

    <!-- Barre de séparation -->
    @include('components.horizontal-separation')

    <!-- Liste des adresses IP -->
    <div class="colCenterContainer">
        <h2 class="w-full bigTextBleuLogo text-center mb-3">Détails de la table Tools</h2>
        <table class="w-full mt-2">
            <!-- Entête du tableau -->
            <thead class="w-full">
                <tr class="tableRow smallText text-center font-bold">
                    @php request()->get('order') == 'asc' ? $order = 'desc' : $order = 'asc'; @endphp
                    <th class="tableCell">ID</th>
                    <th class="tableCell">Utilisateur</th>
                    <th class="tableCell">Name</th>
                    <th class="tableCell">Link</th>
                </tr>
            </thead>

            <!-- Contenue du tableau -->
            <tbody class="w-full normalText">
                @if (isset($tools))
                    @foreach ($tools as $tool)
                        <tr class="tableRow smallText text-center">
                            <td class="tableCell">{{ $tool->id }}</td>
                            @php $user = App\Models\User::where('id', $tool->user_id)->first(); @endphp
                            <td class="tableCell @if ($user->email == env('ADMIN_EMAIL')) fontColorError @endif">{{ "$user->id - $user->name" }}</td>
                            <td class="tableCell">{{ $tool->name }}</td>
                            <td class="tableCell">{{ $tool->link }}</td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>
    </div>

    {{ $tools->links('pagination::tailwind') }}
</section>
@endsection
{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page liste des logs -->
@extends('layouts.page_template')
@section('title')
    Liste des logs
@endsection

@section('content')
<!-- Titre de la page -->
@include('components.page-title', ['title' => 'Liste des logs'])

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


<!-- Affichage des logs -->
<section class="colCenterContainer space-y-12 mt-4 px-6 mb-32 bgPage">
    <!-- Information générale -->
    <div class="colCenterContainer">
        <h2 class="w-full bigTextBleuLogo text-center mb-3">Information générale</h2>
        <div class="rowCenterContainer">
            <span class="normalText">Nombre de logs total : <span class="normalTextBleuLogo font-bold">{{ $nbLogs }}</span></span>
        </div>
        <div class="rowCenterContainer">
            <span class="normalText">Nombre de logs par page : <span class="normalTextBleuLogo font-bold">{{ $perPage }}</span></span>
        </div>
    </div>

    <!-- Barre de séparation -->
    @include('components.horizontal-separation')

    <!-- Liste des logs -->
    <div class="colCenterContainer">
        <h2 class="w-full bigTextBleuLogo text-center mb-3">Liste des logs</h2>
        <table class="w-full mt-2">
            <!-- Entête du tableau -->
            <thead class="w-full">
                <tr class="tableRow smallText text-center font-bold">
                    @php request()->get('order') == 'asc' ? $order = 'desc' : $order = 'asc'; @endphp
                    <th class="tableCell" title="Trier les logs par id @if ($order == 'asc') croissant @else décroissant @endif"><a href="{{ URL::current() . '?sort=id' . '&order=' . $order }}" class="link">id</a></th>
                    <th class="tableCell">name</th>
                    <th class="tableCell">email</th>
                    <th class="tableCell max-sm:hidden" title="Trier les logs par page @if ($order == 'asc') croissant @else décroissant @endif"><a href="{{ URL::current() . '?sort=link_to' . '&order=' . $order }}" class="link">page</a></th>
                    <th class="tableCell" title="Trier les logs par status @if ($order == 'asc') croissant @else décroissant @endif"><a href="{{ URL::current() . '?sort=status' . '&order=' . $order }}" class="link">status</a></th>
                    <th class="tableCell" title="Trier les logs par date @if ($order == 'asc') croissant @else décroissant @endif"><a href="{{ URL::current() . '?sort=created_at' . '&order=' . $order }}" class="link">date</a></th>
                </tr>
            </thead>

            <!-- Contenue du tableau -->
            <tbody class="w-full normalText">
                @if (isset($logs))
                    @foreach ($logs as $log)
                        <tr class="tableRow smallText text-center">
                            <!-- Id du log -->
                            <td class="tableCell"><a href="{{ route('admin.log.details', $log->id) }}" title="Accéder aux détails du log n°{{ $log->id }}" class="link">{{ $log->id }}</a></td>

                            <!-- Nom de l'utilisateur -->
                            @php $user = App\Models\User::where('id', $log->user_id)->first(); @endphp
                            @if ($user != null)
                                <td class="tableCell @if ($user->email == env('ADMIN_EMAIL')) fontColorError @endif">{{ "$user->id - $user->name" }}</td>
                            @else
                                <td class="tableCell">Invité</td>
                            @endif

                            <!-- email de l'utilisateur -->
                            @if ($user != null)
                                <td class="tableCell max-w-[200px] truncate @if ($user->email == env('ADMIN_EMAIL')) fontColorError @endif">{{ $user->email }}</td>
                            @else
                                <td class="tableCell">Invité</td>
                            @endif

                            <!-- Page visitée -->
                            <td class="tableCell max-sm:hidden max-w-[150px] min-[800px]:max-w-[250px] lg:max-w-[400px] truncate"><a href="http://{{ $log->link_to }}" target="_blank" class="link">{{ $log->link_to }}</a></td>

                            <!-- Status du log -->
                            <td class="tableCell rowCenterContainer @if ($log->status) fontColorValid @else fontColorError @endif">
                                @if (!$log->status)
                                    <svg class="smallSizeIcons fontColorValid" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                @else
                                    <svg class="smallSizeIcons fontColorError" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                @endif
                            </td>

                            <!-- Date du virement -->
                            <td class="tableCell">{{ strftime('%d %B %Y %T', strtotime($log->created_at)); }}</td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>
    </div>

    {{ $logs->links('pagination::tailwind') }}
</section>
@endsection

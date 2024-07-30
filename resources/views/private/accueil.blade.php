{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Page d'accueil -->
@extends('layouts.page_template')
@section('title')
    Choix de l'outil
@endsection

@section('content')
<!-- Titre de la page -->
<livewire:page-title :title="'Que voulez-vous faire ?'" />

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
    <livewire:information-message />
</div>


<!-- Affichage des différents profils -->
<section class="colCenterContainer gap-y-10 bgPage mb-[21rem] min-[400px]:mb-68 md:mb-[30rem] lg:mb-[21rem] xl:mb-52">
    <!-- Affichage des différents outils -->
    @foreach ($tools as $tool)
        <div id="position_{{ $tool->position }}" class="rowCenterContainer gap-x-4">
            <a href="{{ $tool->link }}" class="buttonForm">{{ $tool->name }}</a>

            <!-- Actions -->
            <div class="action smallRowCenterContainer px-1 min-[460px]:px-2 min-[500px]:px-4 py-2 hidden">
                <!-- Modifier -->
                <button onclick="editTool('{{ $tool->name }}', '{{ $tool->link }}', '{{ $tool->position }}', '{{ $tool->id }}')" class="smallRowCenterContainer w-fit smallTextReverse font-bold bgBleuLogo hover:bgBleuFonce focus:normalScale rounded-lg min-[500px]:rounded-xl py-1 px-1 min-[500px]:px-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="tinySizeIcons">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                </button>

                <!-- Supprimer -->
                <a href="{{ route('private.tool.remove', $tool->id) }}" onclick="return confirm('Êtes-vous sûr de vouloir supprimer le {{ $tool->name }} ? Cette action est irréversible.')" class="smallRowCenterContainer w-fit smallTextReverse font-bold bgError hover:bgErrorFonce focus:normalScale rounded-lg min-[500px]:rounded-xl py-1 px-1 min-[500px]:px-2 ml-1 min-[500px]:ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="tinySizeIcons">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </a>

                <!-- Down -->
                @if ($tools->min('position') != $tool->position)
                    <a href="{{ route('private.tool.move', ['id' => $tool->id, 'new_position' => $tool->position - 1]) }}" class="smallRowCenterContainer w-fit smallTextReverse font-bold bgBleuLogo hover:bgBleuFonce focus:normalScale rounded-lg min-[500px]:rounded-xl py-1 px-1 min-[500px]:px-2 ml-1 min-[500px]:ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="tinySizeIcons">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                        </svg>
                    </a>
                @endif

                <!-- Up -->
                @if ($tools->max('position') != $tool->position)
                    <a href="{{ route('private.tool.move', ['id' => $tool->id, 'new_position' => $tool->position + 1]) }}" class="smallRowCenterContainer w-fit smallTextReverse font-bold bgBleuLogo hover:bgBleuFonce focus:normalScale rounded-lg min-[500px]:rounded-xl py-1 px-1 min-[500px]:px-2 ml-1 min-[500px]:ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="tinySizeIcons">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                        </svg>
                    </a>
                @endif
            </div>
        </div>
    @endforeach
    
    <!-- Formulaire d'ajout d'un nouvelle outils -->
    <form id="addToolForm" action="{{ route('private.tool.add') }}" method="POST" class="w-10/12 sm:w-8/12 colCenterContainer gap-y-4 hidden">
        @csrf
        <div class="rowCenterContainer gap-x-4">
            <input type="text" name="name" id="name" class="inputForm" minlength="1" maxlength="255" placeholder="Nom de l'outil" required>
            <input type="text" name="link" id="link" class="inputForm" minlength="1" placeholder="Lien de l'outil" required>
        </div>
        <div class="rowCenterContainer gap-x-4">
            <button type="button" onclick="hideActionTool()" class="buttonForm bgError">Annuler</button>
            <button id="addButton" type="submit" class="buttonForm">Ajouter</button>
        </div>
    </form>

    <!-- Bouton pour modifier, ajouter ou supprimer un outil -->
    <button onclick="showActionTool()" id="addToolButton" class="buttonForm mt-8">+ Modifier les outils</button>
</section>
@endsection

@section('scripts')
<script>
    onload = () => {
        @if (session()->has('modif'))
            if ('{{ session()->get('modif') }}' == 'true') {
                showActionTool();
                document.getElementById('position_{{ session()->get('position') }}').scrollIntoView();
            }
        @endif
    }
    /**
     * Affiche les actions possibles pour chaque outil
     */
    function showActionTool()
    {
        /* Affiche les actions possibles pour chaque outil */
        let actions = document.getElementsByClassName("action");
        for (let i = 0; i < actions.length; i++) {
            actions[i].classList.remove('hidden');
        }

        /* Affichage du formulaire d'ajout d'un outil */
        document.getElementById('addToolForm').classList.remove('hidden');
        document.getElementById('addToolButton').classList.add('hidden');
    }

    /**
     * Affiche les actions possibles pour chaque outil
     */
    function hideActionTool()
    {
        /* Affiche les actions possibles pour chaque outil */
        let actions = document.getElementsByClassName("action");
        for (let i = 0; i < actions.length; i++) {
            actions[i].classList.add('hidden');
        }

        /* Affichage du formulaire d'ajout d'un outil */
        document.getElementById('addToolForm').classList.add('hidden');
        document.getElementById('addToolButton').classList.remove('hidden');

        /* Changement de la route du formulaire */
        document.getElementById('addToolForm').action = "{{ route('private.tool.add') }}";
        document.getElementById('addButton').textContent = "Ajouter";
    }

    /**
     * Fonction pour modifier un outil
     */
    function editTool(name, link, id)
    {
        let form = document.getElementById('addToolForm');
        form.action = "{{ route('private.tool.edit') }}";

        document.getElementById('addButton').textContent = "Modifier";
        document.getElementById('name').value = name;
        document.getElementById('link').value = link;

        if (document.getElementById('id') != null) {
            document.getElementById('id').remove();
        }
        form.insertAdjacentHTML('beforeend', '<input type="hidden" id="id" name="id" value="' + id + '">');
    }
</script>
@endsection
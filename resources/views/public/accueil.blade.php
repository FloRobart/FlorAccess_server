<!-- Page d'accueil -->
@extends('layouts.page_template')
@section('title')
    Choix profil
@endsection

@section('content')
<!-- Titre de la page -->
<livewire:page-title :title="'Qui êtes vous ?'" />

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
                                <img class="rounded-xl" src="{{ asset('storage/profil_image/profil_image_' . $profil->id . '.' . $profil->image_extention) }}" alt="Photo de profil">
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
<livewire:password-modal :email="'$email'" />
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

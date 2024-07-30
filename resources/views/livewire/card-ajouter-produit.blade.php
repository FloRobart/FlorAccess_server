{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<a href="{{ route('public.ajouterProduit') }}" class="colBetweenContainer bgElement rounded-xl shadow-lg pt-2 cursor-pointer group" title="Proposer un produit">
    <!------------------------------------------------------------------------------->
    <!-- Carte de produit, affiché sur la page d'accueil et les pages de catégorie -->
    <!------------------------------------------------------------------------------->
    <!-- Nom du produit -->
    <div class="rowCenterContainer h-full px-1 sm:px-3 md:px-5">
        <!-- Nom du produit -->
        <div class="smallColCenterContainer">
            <span class="smallText group-hover:colorFontBleuLogo text-center">Proposer un produit</span>
        </div>
    </div>

    <!-- Image -->
    <div class="colCenterContainer">
        <div class="rowCenterContainer group-hover:normalScale py-4">
            <div class="w-11/12">
                <svg class="w-full colorFontBleuFonce" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </div>
        </div>

        <!-- Texte -->
        <div class="rowCenterContainer py-2">
            <span class="smallText group-hover:colorFontBleuLogo text-center px-1 min-[400px]:px-3">
                Proposer un produit
            </span>
        </div>
    </div>
</a>

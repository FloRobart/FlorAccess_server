{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<div class="colBetweenContainer bgElement rounded-xl shadow-lg pt-2 group cursor-pointer" @if (isset($produit)) title="Détails du produit {{ $produit->nomProduit }}" @endif>
    <!------------------------------------------------------------------------------->
    <!-- Carte de produit, affiché sur la page d'accueil et les pages de catégorie -->
    <!------------------------------------------------------------------------------->
    <!-- Like, Nom du produit et Favoris -->
    <div class="rowBetweenContainer h-full space-x-2 px-1 sm:px-3 md:px-5">
        <!-- Like -->
        <div class="smallRowCenterContainer">
            @if (isset($produit))
                @php
                    $prodId = $produit->id;
                    $nbLike = $produit->nbLike;
                    $isLiked = $produit->LikesUsers->contains(auth()->user());
                @endphp
                @if (auth()->check())
                    <button id="likeButton{{ $prodId }}" class="smallColCenterContainer hover:bigScale cursor-pointer" title="{{ $nbLike }} personne ont aimé ce produit">
                        <span id="likeNumber{{ $prodId }}" class="absolute font fontSizeSmall {{ $isLiked ? 'colorFontReverse' : 'colorFont' }} no-underline hover:no-underline leading-none">{{ $nbLike >= 100 ? '99+' : $nbLike }}</span>
                        <svg id="likeSvg{{ $prodId }}" class="fontSizeIcons colorFontBleuLogo" xmlns="http://www.w3.org/2000/svg" @if ($isLiked) fill="currentColor" @else fill="none" @endif viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    </button>

                    <script>
                        /*-----------------------------*/
                        /* Fonction de Like de produit */
                        /*-----------------------------*/
                        likeButton{{ $prodId }}.addEventListener('click', () => {
                            const url = '{{ route('likesSave', ['idProduit' => $prodId]) }}';
                            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

                            fetch(url, {
                                method: 'GET',
                                headers: {
                                    'X-CSRF-TOKEN': token,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            })
                            .then(response => response.json())
                            .then(data => console.log(data))
                            .catch(error => console.error(error));

                            /* Changement de la couleur du logo like de la carte du produit */
                            const likeSvg{{ $prodId }} = document.getElementById('likeSvg{{ $prodId }}');
                            likeSvg{{ $prodId }}.setAttribute('fill', likeSvg{{ $prodId }}.getAttribute('fill') === 'none' ? 'currentColor' : 'none');

                            /* Changement du nombre et de la couleur du nombre de likes */
                            const likeNumber{{ $prodId }} = document.getElementById('likeNumber{{ $prodId }}');
                            let nbLike = parseInt(likeNumber{{ $prodId }}.innerText);
                            likeNumber{{ $prodId }}.innerText = likeSvg{{ $prodId }}.getAttribute('fill') === 'none' ? nbLike - 1 : nbLike + 1;
                            likeNumber{{ $prodId }}.classList.remove(likeSvg{{ $prodId }}.getAttribute('fill') === 'none' ? 'colorFontReverse' : 'colorFont');
                            likeNumber{{ $prodId }}.classList.add(likeSvg{{ $prodId }}.getAttribute('fill') === 'none' ? 'colorFont' : 'colorFontReverse');

                            /* Gestion du chiffre quand il dépasse 99 */
                            likeNumber{{ $prodId }}.innerText = likeNumber{{ $prodId }}.innerText >= 100 ? '99+' : likeNumber{{ $prodId }}.innerText;
                        });
                    </script>
                @else
                    <a href="{{ route('likesConnexion') }}" class="smallColCenterContainer hover:bigScale cursor-pointer" title="Connectez-vous pour liker des produits">
                        <span id="likeNumber{{ $prodId }}" class="absolute font fontSizeSmall colorFont no-underline hover:no-underline leading-none">{{ $nbLike >= 100 ? '99+' : $nbLike }}</span>
                        <svg class="fontSizeIcons colorFontBleuLogo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    </a>
                @endif
            @else
                <svg class="fontSizeIcons colorFontPage" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
            @endif
        </div>

        <!-- Nom du produit -->
        <div class="smallColCenterContainer">
            @if (isset($produit))
                <a href="{{ route('public.produit', ['id' => $produit->id]) }}" class="normalText group-hover:colorFontBleuLogo text-center">{{ $produit->nomProduit }}</a>
            @else
                <span class="normalText text-center">Aucun produit trouvé</span>
            @endif
        </div>

        <!-- Favoris -->
        <div class="flex justify-center items-center">
            @if (isset($produit))
                @php
                    $isFavorite = $produit->favoriteUsers->contains(auth()->user());
                @endphp
                @if (auth()->check())
                    <button id="favoriteButton{{ $prodId }}" class="hover:bigScale cursor-pointer" title="Ajouter aux favoris">
                        <svg id="favoriteSvg{{ $prodId }}" class="fontSizeIcons colorFontBleuLogo" xmlns="http://www.w3.org/2000/svg" @if ($isFavorite) fill="currentColor" @else fill="none" @endif viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    </button>

                    <script>
                        /*-----------------------------------------*/
                        /* Fonction d'ajout du produit aux favoris */
                        /*-----------------------------------------*/
                        favoriteButton{{ $prodId }}.addEventListener('click', () => {
                            /* Envoi de la requête fetch pour l'ajout du produit aux favoris */
                            const url = '{{ route('favorisSave', ['idProduit' => $prodId]) }}';
                            const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

                            fetch(url, {
                                method: 'GET',
                                headers: {
                                    'X-CSRF-TOKEN': token,
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                }
                            })
                            .then(response => response.json())
                            .then(data => console.log(data))
                            .catch(error => console.error(error));


                            /* Changement de la couleur du logo favoris de la carte du produit */
                            const favoriteSvg{{ $prodId }} = document.getElementById('favoriteSvg{{ $prodId }}');
                            favoriteSvg{{ $prodId }}.setAttribute('fill', favoriteSvg{{ $prodId }}.getAttribute('fill') === 'none' ? 'currentColor' : 'none');

                            /* Gestion du chiffre dans le header */
                            let headerFavoriteNumber = document.getElementById('headerFavoriteNumber');
                            headerFavoriteNumber.innerText = parseInt(headerFavoriteNumber.innerText) + (favoriteSvg{{ $prodId }}.getAttribute('fill') === 'none' ? -1 : 1);
                            headerFavoriteNumber.classList.remove(headerFavoriteNumber.innerText > 0 ? 'colorFont' : 'colorFontReverse');
                            headerFavoriteNumber.classList.add(headerFavoriteNumber.innerText > 0 ? 'colorFontReverse' : 'colorFont');

                            /* Changement de la couleur du logo dans le header */
                            let headerFavoriteLogo = document.getElementById('headerFavoriteLogo');
                            headerFavoriteLogo.classList.remove(headerFavoriteNumber.innerText > 0 ? 'colorFontPage' : 'colorFontBleuLogo');
                            headerFavoriteLogo.classList.add(headerFavoriteNumber.innerText > 0 ? 'colorFontBleuLogo' : 'colorFontPage');

                            /* Gestion du chiffre quand il dépasse 99 */
                            headerFavoriteNumber.innerText = headerFavoriteNumber.innerText >= 100 ? '99+' : headerFavoriteNumber.innerText;
                        });
                    </script>
                @else
                    <a href="{{ route('favorisConnexion') }}" class="hover:bigScale cursor-pointer" title="Connectez-vous pour ajouter des produits à vos favoris">
                        <svg class="fontSizeIcons colorFontBleuLogo" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    </a>
                @endif
            @else
                <svg class="fontSizeIcons colorFontPage" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
            @endif
        </div>
    </div>

    <!-- Image et texte sous l'image -->
    <div class="colCenterContainer">
        <!-- Image -->
        @if (isset($produit))
            <div class="rowCenterContainer group-hover:normalScale py-4">
                <a class="w-11/12" title="Détails du produit {{ $produit->nomProduit }}" href="{{ route('public.produit', ['id' => $produit->id]) }}">
                    @if ($produit->pathImgProduit == null)
                        <img class="w-full" src="{{ asset('img/product_placeholder.png') }}" alt="Placeholder image">
                    @else
                        <img class="w-full" src="{{ $produit->pathImgProduit }}" alt="Image du produit">
                    @endif
                </a>
            </div>
        @else
            <div class="rowCenterContainer group-hover:normalScale py-4">
                <div class="w-11/12" title="Aucun produit">
                    <img class="w-full" src="{{ asset('img/product_placeholder.png') }}" alt="Placeholder image">
                </div>
            </div>
        @endif

        <!-- Texte -->
        <div class="colCenterContainer pb-3">
            @if (isset($produit))
                <span class="normalText text-center px-1 min-[400px]:px-3 font-bold">{{ $produit->prix }} €</span>
                <span class="normalText text-center px-1 min-[400px]:px-3">
                    n°<b>{{ $produit->classement }}</b> des <a href="{{ route('public.categorie', ['id' => $produit->idCategorie]) }}" class="underline hover:colorFontBleuLogo" title="Accéder à la catégorie {{ $produit->getNomCategorie() }}"><b>{{ $produit->getNomCategorie() }}</b></a>
                </span>
            @else
                <span class="normalText text-center px-1 min-[400px]:px-3">
                    Aucun produit trouvé
                </span>
            @endif
        </div>
    </div>
</div>

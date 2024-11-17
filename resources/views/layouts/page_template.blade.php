{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- En-tête de la page -->
@include('layouts.head')

@section('title')
    @yield('title', 'Maison')
@endsection

@section('styles')
    @yield('styles')
@endsection

@section('scripts')
    @yield('scripts')
@endsection

    <body class="w-full bgPage">
        <!-- Header de la page -->
        <!----------------------->
        @include('layouts.header')

        <!-- Contenu de la page -->
        <!------------------------>
        <main class="w-full">
            @yield('content')
        </main>

        <!-- Pied de page de la page -->
        <!----------------------------->
        @include('layouts.footer')
    </body>
</html>
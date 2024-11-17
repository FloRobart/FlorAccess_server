{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!DOCTYPE html>
<html lang="fr" class="w-full h-full bgPage">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <!-- Titre de la page -->
        <!---------------------->
        <title>Maison - @yield('title')</title>

        <!-- Fonts -->
        <!----------->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link rel="stylesheet" href="https://fonts.bunny.net/css?family=figtree:400,600&display=swap" />

        <!-- Styles CSS -->
        <!---------------->
        <link rel="stylesheet" href="{{ asset('css/scrollToTop.css') }}">
        @vite('resources/css/app.css')
        @yield('styles')

        <!-- Scripts JavaScript -->
        <!------------------------>
        <script src="{{ asset('js/scrollToTop.js') }}"></script>
        @yield('scripts')
    </head>
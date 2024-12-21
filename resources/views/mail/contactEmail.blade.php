{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!-- Contenu du mail envoyé -->
<!DOCTYPE html>
<html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>

    <body>
        <div>
            <h2>Message de {{ $depuis }}</h2>
            <h3>Utilisateur : 
                @if (auth()->check())
                    {{ auth()->user()->name }}
                @else
                    Non connecté
                @endif
            </h3>
            <hr>
            <div>{{ $messages }}</div>
        </div>
    </body>
</html>
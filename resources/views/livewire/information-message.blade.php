{{--
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<div class="colCenterContainer">
    @if (session()->has('error'))
        <div class="rowCenterContainer">
            <span class="normalTextError text-center">{{ session()->get('error') }}</span>
        </div>
    @endif

    @if (session()->has('success'))
        <div class="rowCenterContainer">
            <span class="normalTextValid text-center">{{ session()->get('success') }}</span>
        </div>
    @endif
</div>

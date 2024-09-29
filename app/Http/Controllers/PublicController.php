<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Models\User;

class PublicController extends Controller
{
    /*---------*/
    /* Accueil */
    /*---------*/
    /**
     * Affiche la page d'accueil
     * @return \Illuminate\View\View Vue de la page d'accueil
     * @method GET
     */
    public function accueil()
    {
        $profils = User::all();
        return view('public.accueil', ['profils' => $profils]);
    }
}
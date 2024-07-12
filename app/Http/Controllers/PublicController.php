<?php
namespace App\Http\Controllers;

use App\Models\User;

class PublicController extends Controller
{
    /*---------*/
    /* Accueil */
    /*---------*/
    /**
     * Affiche la page d'accueil
     */
    public function accueil()
    {
        $profils = User::all();
        return view('public.accueil', ['profils' => $profils]);
    }
}
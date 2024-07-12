<?php
namespace App\Http\Controllers;


class PrivateController extends Controller
{
    /*---------*/
    /* Accueil */
    /*---------*/
    /**
     * Affiche la page d'accueil
     */
    public function accueil()
    {
        return view('private.accueil');
    }
}
<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Mail\ContactEmail;
use Illuminate\Support\Facades\Mail;


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
        if (Auth::check()) { return redirect()->route('private.accueil'); }

        $profils = User::all();
        return view('public.accueil', ['profils' => $profils]);
    }



    /*---------*/
    /* Contact */
    /*---------*/
    /**
     * Affiche le formulaire de contact
     * @return \Illuminate\View\View Vue du formulaire de contact
     * @method GET
     */
    public function contact()
    {
        return view('public.contact')->with('subject', 'Contact');
    }

    /**
     * Affiche le formulaire de contact
     * @return \Illuminate\View\View Vue du formulaire de contact
     * @method GET
     */
    public function bugReport()
    {
        return view('public.contact')->with('subject', 'Rapport de bug');
    }


    /**
     * Envoie un mail à l'administrateur
     * @param \Illuminate\Http\Request $request Informations du formulaire
     * @return \Illuminate\Http\RedirectResponse Redirection vers la page de contact
     * @method POST
     */
    public function contactSave(Request $request)
    {
        /* Récupération des informations du formulaire */
        $request->validate([
            'name' => 'required|max:980',
            'email' => 'required|email',
            'message' => 'required|min:10',
            'subject' => 'required|max:50',
        ], [
            'name.required' => 'Le sujet du mail est obligatoire',
            'name.max' => 'Le sujet ne peux pas contenir plus de 980 caractères',
            'email.required' => 'L\'adresse mail est obligatoire',
            'email.email' => 'L\'adresse mail n\'est pas valide',
            'message.required' => 'Le message est obligatoire',
            'message.min' => 'Le message doit contenir au moins 10 caractères',
            'subject.required' => 'Vous ne devez pas modifier le sujet',
            'subject.max' => 'Vous ne devez pas modifier le sujet',
        ]);

        /* Envoi du mail */
        Mail::to(env('ADMIN_EMAIL'))->send(new ContactEmail($request->name, $request->email, $request->subject, $request->message));

        /* Redirection vers la page d'accueil */
        return back()->with('success', 'Votre message à bien été envoyé à l\'administrateur');
    }
}

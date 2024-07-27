<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florisrobart.pro@gmail.com>
 */

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;


class ProfilController extends Controller
{
    /*-------------*/
    /* Inscription */
    /*-------------*/
    /**
     * Affiche le formulaire d'inscription
     */
    public function inscription()
    {
        return view('profil.inscription');
    }


    /**
     * Enregistre les informations de l'inscription
     */
    public function inscriptionSave(Request $request)
    {
        /* Validation des informations du formulaire */
        $request->validate([
            'name' => 'required|min:3|max:18',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:4|max:20',
            'password_confirmation' => 'required|same:password',
            'profil_image' => 'required|image|mimes:jpeg,png,jpg|max:50000',
        ], [
            'name.required' => 'Le nom est obligatoire',
            'name.min' => 'Le nom doit contenir au moins 3 caractères',
            'name.max' => 'Le nom ne peux pas contenir plus de 18 caractères',
            'email.required' => 'L\'adresse mail est obligatoire',
            'email.email' => 'L\'adresse mail n\'est pas valide',
            'email.unique' => 'Vous avez déjà un compte avec cette adresse mail',
            'password.required' => 'Le mot de passe est obligatoire',
            'password.min' => 'Le mot de passe doit contenir au moins 4 caractères',
            'password.max' => 'Le mot de passe ne peux pas contenir plus de 20 caractères',
            'password_confirmation.required' => 'La confirmation du mot de passe est obligatoire',
            'password_confirmation.same' => 'Les mots de passe doivent être identiques',
            'profil_image.required' => 'L\'image de profil est obligatoire',
            'profil_image.image' => 'Votre image de profil doit être une image',
            'profil_image.mimes' => 'Votre image de profil doit être au format jpeg, jpg ou png',
            'profil_image.max' => 'Votre image de profil est trop volumineuse (max 50Mo)',
        ]);

        /* Récupération des informations du formulaire */
        $name = $request->name;
        $email = $request->email;
        $password = Hash::make($request->password);
        $imgProfil = base64_encode(file_get_contents($request->profil_image));

        /* Enregistrement des informations dans la base de données */
        User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'imgProfil' => $imgProfil,
            'last_login_at' => now(),
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            return redirect()->route('accueil')->with('success', 'Inscription réussie 👍');
        } else {
            return back()->with(['error' => 'Erreur lors de l\'inscription réessayez plus tard ou envoyez un mail à l\'administrateur à l\'adresse suivante : ', 'name' => $name, 'email' => $email]); // TODO : Ajouter l'adresse mail de l'administrateur
        }
    }



    /*-----------*/
    /* Connexion */
    /*-----------*/
    /**
     * Connecte l'utilisateur si les informations sont correctes
     */
    public function connexionSave(Request $request)
    {
        /* Validation des informations du formulaire */
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|min:4|max:20',
        ], [
            'email.required' => 'L\'adresse mail est obligatoire',
            'email.email' => 'L\'adresse mail n\'est pas valide',
            'email.exists' => 'Aucun compte n\'est associé à cette adresse mail',
            'password.required' => 'Le mot de passe est obligatoire',
            'password.min' => 'Le mot de passe doit contenir au moins 4 caractères',
            'password.max' => 'Le mot de passe ne peux pas contenir plus de 20 caractères',
        ]);

        /* Récupération des informations du formulaire */
        $email = $request->email;
        $password = $request->password;

        /* Vérification des informations de connexion */
        $user = User::where('email', $email)->first();
        if (!$user || !Hash::check($password, $user->password)) {
            return back()->with(['error' => 'Mot de passe incorrect', 'email' => $email]);
        }

        /* Connexion de l'utilisateur */
        if (Auth::check()) { Auth::logout(); }
        Auth::login($user);

        /* Mise à jour de la date de dernière connexion */
        $user->last_login_at = now();
        $user->save();

        /* Redirection vers la page d'accueil */
        return redirect()->route('private.accueil');
    }



    /*--------*/
    /* Profil */
    /*--------*/
    /**
     * Affiche la page du profil
     */
    public function profil()
    {
        if (auth()->check()) {
            return view('profil.profil');
        } else {
            return redirect()->route('accueil');
        }
    }


    /**
     * Enregistre les informations du profil
     */
    public function profilSave(Request $request)
    {
        /* Récupération des informations du formulaire */
        $request->validate([
            'name' => 'required|min:3|max:18',
            'email' => 'required|email|unique:users,email,' . Auth::user()->id,
            'password' => 'nullable|min:4|max:20',
            'profil_image' => 'nullable|image|mimes:jpeg,png,jpg|max:50000',
        ], [
            'name.required' => 'Le nom est obligatoire',
            'name.min' => 'Le nom doit contenir au moins 3 caractères',
            'name.max' => 'Le nom ne peux pas contenir plus de 18 caractères',
            'email.required' => 'L\'adresse mail est obligatoire',
            'email.email' => 'L\'adresse mail n\'est pas valide',
            'email.unique' => 'Vous ne pouvez pas utiliser cette adresse mail',
            'password.min' => 'Le mot de passe doit contenir au moins 4 caractères',
            'password.max' => 'Le mot de passe ne peux pas contenir plus de 20 caractères',
            'profil_image.image' => 'Votre image de profil doit être une image',
            'profil_image.mimes' => 'Votre image de profil doit être au format jpeg, jpg ou png',
            'profil_image.max' => 'Votre image de profil est trop volumineuse (max 50Mo)',
        ]);

        /* Vérification des informations du formulaire */
        $name = $request->name;
        $email = $request->email;

        $modif = false;
        /* Enregistrement des informations dans la base de données */
        if (auth()->user()->name != $name || auth()->user()->email != $email || $request->password != null)
        {
            $user = User::find(Auth::user()->id);

            if ($user->name != $name) { $user->name = $name; }
            if ($user->email != $email) { $user->email = $email; }
            if ($request->password != null) { $user->password = Hash::make($request->password); }

            $user->save();
            $modif = true;
        }

        /* Enregistrement de l'image de profil */
        if ($request->profil_image != null)
        {
            $user = User::find(Auth::user()->id);
            $user->imgProfil = base64_encode(file_get_contents($request->profil_image));
            $user->save();
            $modif = true;
        }

        if ($modif)
        {
            /* Redirection vers la page du profil */
            return back()->with('success', 'Votre profil à bien été mis à jour 👍');
        }

        /* Redirection vers la page du profil */
        return back()->with('success', 'Vous avez fait aucune modification 👍');
    }



    /*-------------*/
    /* Déconnexion */
    /*-------------*/
    /**
     * Déconnecte l'utilisateur et le redirige vers la page d'accueil
     */
    public function deconnexion()
    {
        /* Déconnexion de l'utilisateur */
        if (Auth::check())
        {
            Auth::logout();
        }

        /* Redirection vers la page d'accueil */
        return Redirect()->route('accueil');
    }



    /*-----------------------*/
    /* Suppression de compte */
    /*-----------------------*/
    /**
     * Déconnecte l'utilisateur
     * Puis supprime le compte de l'utilisateur
     * Puis le redirige vers la page d'accueil
     */
    public function supprimerCompte()
    {
        /* Vérification de la connexion de l'utilisateur */
        if (!Auth::check()) {
            return Redirect('accueil');
        }

        /* Récupération des informations de l'utilisateur */
        $user = User::find(Auth::user()->id);

        /* Déconnexion de l'utilisateur */
        Auth::logout();

        /* Suppression des sessions de l'utilisateur */
        DB::table('sessions')->where('user_id', $user->id)->delete();

        /* Suppression du compte de l'utilisateur */
        User::destroy($user->id);

        /* Redirection vers la page d'accueil */
        return Redirect('accueil');
    }
}

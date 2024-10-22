<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Mail\AddIpMail;
use App\Models\AdresseIP;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

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
            'profil_image' => 'required|image|mimes:jpeg,png,jpg',
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

        /* Enregistrement de l'adresse IP de l'utilisateur */
        $adresseIP = request()->ip();
        DB::table('adresse_ips')->insert([
            'user_id' => User::where('email', $email)->first()->id,
            'adresse_ip' => $adresseIP,
            'est_bannie' => false,
        ]);

        /* Connexion de l'utilisateur */
        if (Auth::attempt($request->only('email', 'password'))) {
            return redirect()->route('private.accueil')->with('success', 'Inscription réussie 👍');
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

        /* Vérification de l'adresse IP */
        $message = [
            '0' => 'C\'est la première fois que vous vous connectez depuis cet endroit, veuillez certifier qu\'il s\'agit bien de vous en cliquant sur le lien envoyé par mail à l\'adresse suivante : ' . $email,
            '2' => 'Un email vous a déjà été envoyé à l\'adresse ' . $email . ' pour vérifier qu\'il s\'agit bien de vous, veuillez vérifier votre boite mail',
            '3' => 'Vous êtes bannie ! Cet évènement serait rapporter à l\'administrateur, en ignorant votre banissement vous vous engagez à de potentiel poursuite judiciaire !',
        ];

        $ipFound = $this->verifIp($user, request()->ip());
        if ($ipFound != 1) {
            return back()->with(['error' => $message[$ipFound], 'email' => $email]);
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



    /*------------*/
    /* Adresse IP */
    /*------------*/
    /**
     * Vérifie l'adresse IP de l'utilisateur. Si l'adresse IP n'est pas autorisée, un mail est envoyé à l'utilisateur pour l'ajouter à la liste blanche
     * @param User $user l'utilisateur qui veut se connecter
     * @param string $ip l'adresse IP de l'utilisateur
     * @return int
     * - 0 si l'adresse IP n'est pas autorisée
     * - 1 si l'adresse IP est autorisée
     * - 2 si un mail a déjà été envoyé
     * - 3 si l'adresse IP est bannie
     */
    public function verifIp(User $user, string $ip)
    {
        /* Vérification si l'adresse IP est bannie */
        $adresseIPBannie = AdresseIP::where('user_id', $user->id)->where('adresse_ip', $ip)->where('est_bannie', true)->first();
        if ($adresseIPBannie) {
            return 3;
        }

        /* Vérification si l'adresse IP est autorisée */
        $authorisedIps = AdresseIP::where('user_id', $user->id)->where('est_bannie', false)->get();
        $ipFound = false;
        foreach ($authorisedIps as $authorisedIp) {
            if ($authorisedIp->adresse_ip == $ip) {
                $ipFound = true;
                break;
            }
        }

        if (!$ipFound)
        {
            /* Vérification de l'existence d'un token de connexion */
            $tokenDB = DB::table('adresse_ips_tokens')->where('email', $user->email)->where('adresse_ip', $ip)->first();
            if ($tokenDB != null) {
                return 2;
            }

            /* Génération d'un token de connexion */
            $token = bin2hex(random_bytes(64));

            /* Enregistrement du token de connexion */
            DB::table('adresse_ips_tokens')->insert([
                'email' => $user->email,
                'adresse_ip' => $ip,
                'token' => $token,
                'created_at' => now(),
            ]);

            /* Envoi du mail de vérification */
            $data = [
                'email' => $user->email,
                'token' => $token,
                'ip' => $ip,
            ];

            /* Envoie du mail */
            Mail::to($user->email)->send(new AddIpMail($data));
        }

        return $ipFound ? 1 : 0;
    }

    /**
     * Ajoute une adresse IP à la liste blanche
     * @param string $token le token de connexion
     * @param string $ip l'adresse IP à ajouter
     * @return Route accueil | avec un message de succès ou d'erreur
     * @method GET
     */
    public function addIp(string $token, string $ip)
    {
        /*-------------------------------*/
        /* Récupération des informations */
        /*-------------------------------*/
        $tokenDB = DB::table('adresse_ips_tokens')->where('token', $token)->first();
        $email = $tokenDB->email;
        $user = User::where('email', $email)->first();
        $adresseIp = request()->ip();


        /*--------------------------------------*/
        /* Vérification de la validité du token */
        /*--------------------------------------*/
        if ($tokenDB == null)
        {
            /* Bannissement de l'adresse IP */
            $this->banIp($email, $adresseIp);

            return redirect()->route('accueil')->with('error', 'Vous avez été bannie !');
        }


        /*---------------------------------------------*/
        /* Vérification de la validité de l'adresse IP */
        /*---------------------------------------------*/
        if ($ip != $adresseIp || $ip != $tokenDB->adresse_ip || $adresseIp != $tokenDB->adresse_ip)
        {
            /* Bannissement de l'adresse IP */
            $this->banIp($email, $adresseIp);

            return redirect()->route('accueil')->with('error', 'Vous avez changer d\'endroit entre le moment où vous avez demander à vérifier votre email et le moment ou vous avez cliqué sur le lien dans le mail, par mesure de sécurité vous avez été bannie. Si c\'est bien vous qui avez demander à vérifier votre email, veuillez contacter l\'administrateur');
        }
        else
        {
            $adresseIPBannie = AdresseIP::where('user_id', $user->id)->where('adresse_ip', $ip)->where('est_bannie', true)->first();
            if ($adresseIPBannie)
            {
                return redirect()->route('accueil')->with(['error' => 'Vous êtes bannie ! Cet évènement serait rapporter à l\'administrateur, en ignorant votre banissement vous vous engagez à de potentiel poursuite judiciaire !', 'email' => $email]);
            }
        }


        /*----------------------------------*/
        /* Ajout de l'adresse IP à la liste */
        /*----------------------------------*/
        $builder = DB::table('adresse_ips')->insert([
            'user_id' => $user->id,
            'adresse_ip' => $ip,
            'est_bannie' => false,
        ]);

        if ($builder != null)
        {
            /* Suppression du token */
            DB::table('adresse_ips_tokens')->where('token', $token)->delete();

            return redirect()->route('accueil')->with('success', 'Vous pouvez maintenant vous connecter depuis cette endroit 👍');
        }

        return redirect()->route('accueil')->with('error', 'Une erreur est survenue, si le problème persiste veuillez contacter l\'administrateur');
    }

    /**
     * Bannit l'adresse IP
     * @param string $email
     * @param string $ip à bannir
     * @return bool true si l'adresse IP est bannie sinon false
     */
    private function banIp(string $email, string $ip)
    {
        /* Récupération de l'utilisateur */
        $user = User::where('email', $email)->first();
        if ($user == null) { return false; }

        /* Vérification si l'adresse IP est déjà bannie */
        $adresseIp = AdresseIP::where('user_id', $user->id)->where('adresse_ip', $ip)->first();
        if ($adresseIp != null)
        {
            $adresseIp->est_bannie = true;
            $adresseIp->save();

            return true;
        }

        /* Bannissement de l'adresse IP */
        $builder = DB::table('adresse_ips')->insert([
            'user_id' => $user->id,
            'adresse_ip' => $ip,
            'est_bannie' => true,
        ]);

        if ($builder != null)
        {
            /* Suppression du token */
            DB::table('adresse_ips_tokens')->where('email', $email)->where('adresse_ip', $ip)->delete();
        }

        return $builder != null;
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
            'profil_image' => 'nullable|image|mimes:jpeg,png,jpg',
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

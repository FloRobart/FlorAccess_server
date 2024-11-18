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
use App\Mail\VerificationEmail;


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
            'password' => 'required|min:12|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/',
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
            'password.min' => 'Le mot de passe doit contenir au moins 12 caractères',
            'password.regex' => 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
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
            LogController::addLog('Enregistrement de l\'inscription');
            return redirect()->route('verification.email')->with('success', 'Inscription réussie 👍');
        } else {
            LogController::addLog('Erreur lors de l\'inscription', null, 1);
            return back()->with(['error' => 'Erreur lors de l\'inscription réessayez plus tard ou contactez l\'administrateur.']);
        }
    }


    /**
     * Génère un code de vérification
     * Envoie un mail de vérification
     * Affiche la page de vérification de l'e-mail qui permet de rentrer le code de vérification
     * @return \Illuminate\View\View profil.verificationEmail
     */
    public function showVerificationEmail()
    {
        /* Vérification de la présence du code de vérification dans la session pour éviter de renvoyer un mail à chaque rafraichissement de la page */
        if (session('code') == null)
        {
            /* Génération du code de vérification */
            $code = strval(rand(100000, 999999));

            /* Enregistrement du code de vérification dans la session */
            session(['code' => $code]);

            /* Envoi du mail de vérification */
            Mail::to(Auth::user()->email)->send(new VerificationEmail($code));
        }

        return view('profil.verificationEmail');
    }

    /**
     * Vérifie le code de vérification
     * Enregistre la date de vérification de l'adresse e-mail
     * @param Request $request
     * @return Route private.accueil | avec un message de succès ou d'erreur
     */
    public function verificationEmailSave(Request $request)
    {
        $request->validate([
            'code1' => 'required|numeric|digits:1',
            'code2' => 'required|numeric|digits:1',
            'code3' => 'required|numeric|digits:1',
            'code4' => 'required|numeric|digits:1',
            'code5' => 'required|numeric|digits:1',
            'code6' => 'required|numeric|digits:1',
        ]);

        $code = $request->code1 . $request->code2 . $request->code3 . $request->code4 . $request->code5 . $request->code6;

        if ($code != session('code')) {
            session()->forget('code');
            return redirect()->route('verification.email')->with('error', 'Le code de vérification est incorrect. Un nouveau mail de vérification vous a été envoyé');
        }

        /* Suppression du code de vérification */
        session()->forget('code');

        /* Vérification de l'adresse e-mail */
        $user = User::find(Auth::user()->id);
        $user->email_verified_at = now();
        $user->save();

        /* Redirection vers la page d'accueil */
        return redirect()->route('private.accueil')->with('success', 'Votre adresse e-mail a bien été vérifiée 👍');
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
            'email' => 'required|email',
            'password' => 'required',
        ], [
            'email.required' => 'L\'adresse mail est obligatoire',
            'email.email' => 'L\'adresse mail n\'est pas valide',
            'password.required' => 'Le mot de passe est obligatoire',
            'password.min' => 'Le mot de passe doit contenir au moins 12 caractères',
        ]);

        /* Récupération des informations du formulaire */
        $email = $request->email;
        $password = $request->password;

        /* Vérification du mail de l'utilisateur */
        $user = User::where('email', $email)->first();
        if (!$user) {
            /* Sécurité : on réalise ses actions inutiles pour éviter les attaques par analyse de temps de réponse */
            $fakePassword = Hash::make('fakepassword');
            Hash::check($password, $fakePassword);

            LogController::addLog('Un utilisateur a tenté de se connecter avec un e-mail incorrectes', $user->id ?? null);
            return back()->with(['error' => 'Identifiant ou mot de passe incorrect']);
        }

        /* Vérification du mot de passe de l'utilisateur */
        if (!Hash::check($password, $user->password)) {
            $fakePassword = Hash::make('fakepassword');
            LogController::addLog('Un utilisateur a tenté de se connecter avec un mot de passe incorrectes', $user->id ?? null);
            return back()->with(['error' => 'Identifiant ou mot de passe incorrect']);
        }

        /* Vérification de l'adresse IP */
        $message = [
            '0' => 'C\'est la première fois que vous vous connectez depuis cet endroit, veuillez certifier qu\'il s\'agit bien de vous en cliquant sur le lien envoyé par mail à l\'adresse suivante : ' . $email,
            '2' => 'Un email vous a déjà été envoyé à l\'adresse ' . $email . ' pour vérifier qu\'il s\'agit bien de vous, veuillez vérifier votre boite mail',
            '3' => 'Vous êtes bannie ! Cet évènement serait rapporter à l\'administrateur, en ignorant votre banissement vous vous engagez à de potentiel poursuite judiciaire !',
        ];

        $ipFound = $this->verifIp($user, request()->ip());
        if ($ipFound != 1) {
            LogController::addLog('Un utilisateur a tenté de se connecter depuis une adresse IP non autorisée', $user->id ?? null);
            return back()->with(['error' => $message[$ipFound]]);
        }

        /* Connexion de l'utilisateur */
        if (Auth::check()) { Auth::logout(); }
        Auth::login($user);

        /* Mise à jour de la date de dernière connexion */
        $user->last_login_at = now();
        $user->save();

        /* Redirection vers la page d'accueil */
        LogController::addLog('Connexion de l\'utilisateur');
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
            LogController::addLog('L\'adresse IP de l\'utilisateur ('.$ip.') est bannie', $user->id, 1);
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
                LogController::addLog('Un mail de vérification de l\'adresse IP ('.$ip.') a déjà été envoyé', $user->id);
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
            LogController::addLog('Envoi d\'un mail de vérification de l\'adresse IP ('.$ip.')', $user->id);
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
            LogController::addLog('Bannissement de l\'adresse IP : ' . $ip . ' car le token est invalide', $user->id, 1);

            /* Bannissement de l'adresse IP */
            $this->banIp($email, $adresseIp);

            return redirect()->route('accueil')->with('error', 'Vous avez été bannie !');
        }


        /*---------------------------------------------*/
        /* Vérification de la validité de l'adresse IP */
        /*---------------------------------------------*/
        if ($ip != $adresseIp || $ip != $tokenDB->adresse_ip || $adresseIp != $tokenDB->adresse_ip)
        {
            LogController::addLog('Bannissement de l\'adresse IP : ' . $ip . ' car l\'adresse IP n\'est pas valide', $user->id, 1);

            /* Bannissement de l'adresse IP */
            $this->banIp($email, $adresseIp);

            return redirect()->route('accueil')->with('error', 'Vous avez changer d\'endroit entre le moment où vous avez demander à vérifier votre email et le moment ou vous avez cliqué sur le lien dans le mail, par mesure de sécurité vous avez été bannie. Si c\'est bien vous qui avez demander à vérifier votre email, veuillez contacter l\'administrateur');
        }
        else
        {
            $adresseIPBannie = AdresseIP::where('user_id', $user->id)->where('adresse_ip', $ip)->where('est_bannie', true)->first();
            if ($adresseIPBannie)
            {
                LogController::addLog('Un utilisateur a tenté de se connecter depuis une IP bannie', $user->id, 1);
                return redirect()->route('accueil')->with(['error' => 'Vous êtes bannie ! Cet évènement sera rapporter à l\'administrateur, en ignorant votre banissement vous vous engagez à de potentiel poursuite judiciaire !']);
            }
        }


        /*----------------------------------*/
        /* Ajout de l'adresse IP à la liste */
        /*----------------------------------*/
        LogController::addLog('Ajout de l\'adresse IP : ' . $ip . ' à la liste blanche', $user->id);
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

        LogController::addLog('Erreur lors de l\'ajout de l\'adresse IP : ' . $ip . ' à la liste blanche', $user->id, 1);
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
            LogController::addLog('Bannissement de l\'adresse IP : ' . $ip, $user->id);

            /* Suppression du token */
            DB::table('adresse_ips_tokens')->where('email', $email)->where('adresse_ip', $ip)->delete();
        }
        else
        {
            LogController::addLog('Erreur lors du bannissement de l\'adresse IP : ' . $ip, $user->id, 1);
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
        if (Auth::check()) {
            return view('profil.profil');
        } else {
            LogController::addLog('Un utilisateur non connecté a tenté d\'accéder à la page du profil', null, 1);
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
            'password' => 'nullable|min:12|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/',
            'profil_image' => 'nullable|image|mimes:jpeg,png,jpg',
        ], [
            'name.required' => 'Le nom est obligatoire',
            'name.min' => 'Le nom doit contenir au moins 3 caractères',
            'name.max' => 'Le nom ne peux pas contenir plus de 18 caractères',
            'email.required' => 'L\'adresse mail est obligatoire',
            'email.email' => 'L\'adresse mail n\'est pas valide',
            'email.unique' => 'Vous ne pouvez pas utiliser cette adresse mail',
            'password.min' => 'Le mot de passe doit contenir au moins 12 caractères',
            'password.regex' => 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
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
            LogController::addLog('Modification des informations du profil', $user->id);

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
            $user = User::find(Auth::user()->id);
            Auth::logout();
            
            LogController::addLog('Déconnexion de l\'utilisateur ' . $user->name, $user->id);
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
            LogController::addLog('Un utilisateur non connecté a tenté de supprimer un compte');
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

        /* Suppression des outils de l'utilisateur */
        DB::table('tools')->where('user_id', $user->id)->delete();

        LogController::addLog('Suppression du compte de l\'utilisateur', $user->id);

        /* Redirection vers la page d'accueil */
        return Redirect()->route('accueil');
    }
}

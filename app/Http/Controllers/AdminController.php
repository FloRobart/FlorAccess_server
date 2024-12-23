<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use Illuminate\Http\Request;
use App\Models\AdresseIp;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Tools;
use Illuminate\Support\Facades\DB;
use App\Models\Log;


class AdminController extends Controller
{
    /*=========*/
    /* Accueil */
    /*=========*/
    /**
     * Affiche la page d'accueil de l'administration
     * @return \Illuminate\Contracts\View\View admin.accueil
     * @method GET
     */
    public function accueil()
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page d'accueil de l'administrateur {accueil}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        return view('admin.accueil');
    }



    /*========================*/
    /* Gestion des adresse IP */
    /*========================*/
    /**
     * Affiche la table des adresses IP
     * @param Request $request
     * @return \Illuminate\Contracts\View\View admin.adresseIp
     * @method GET
     */
    public function adresseIp(Request $request)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des adresse IP {adresseIp}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';
        $perPage = $request->query('perPage') ?? 20;

        $nbAdresseIp = AdresseIp::count();
        $adresseIps = AdresseIp::orderBy($sort, $order)->paginate($perPage);
        $users = User::orderBy('id', 'asc')->get();
        return view('admin.adresseIp', compact('nbAdresseIp', 'adresseIps', 'users', 'perPage'));
    }

    /**
     * Enregistre une adresse IP
     * @param Request $request
     * @return Route admin.adresse_ip
     * @method POST
     */
    public function adresseIpSave(Request $request)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page de sauvegarde des adresse IP {adresseIpSave}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        /* Validation des données */
        $request->validate([
            'ip' => 'required|ipv4',
            'user_id' => 'required|integer',
        ], [
            'ip.required' => 'L\'adresse IP est obligatoire',
            'ip.ipv4' => 'L\'adresse IP doit être une adresse IPv4',
            'user_id.required' => 'L\'utilisateur est obligatoire',
            'user_id.integer' => 'L\'utilisateur doit être un entier',
        ]);

        if (User::where('id', $request->user_id)->first() == null) { return back()->with('error', 'L\'utilisateur n\'existe pas'); }

        $ip = AdresseIp::where('adresse_ip', $request->ip)->where('user_id', $request->user_id)->first();
        if ($ip != null)
        {
            $ip->est_bannie = $request->est_bannie == null ? 0 : 1;
            if (!$ip->save()) {
                LogController::addLog("Erreur lors de la modification de l'adresse IP $ip->idate {adresseIpSave}", Auth::check() ? Auth::user()->id : null, 1);
                return back()->with('error', 'Erreur lors de la modification de l\'adresse IP');
            }
            return back()->with('success', 'L\'adresse IP a bien été modifiée');
        }

        /* Enregistrement de l'adresse IP */
        $adresseIp = new AdresseIp();
        $adresseIp->adresse_ip = $request->ip;
        $adresseIp->user_id = $request->user_id;

        $adresseIp->est_bannie = $request->est_bannie == null ? 0 : 1;
        
        if (!$adresseIp->save()) {
            LogController::addLog("Erreur lors de l'enregistrement de l'adresse IP $request->ip {adresseIpSave}", Auth::check() ? Auth::user()->id : null, 1);
            return back()->with('error', 'Erreur lors de l\'enregistrement de l\'adresse IP');
        }

        return back()->with('success', 'L\'adresse IP a bien été enregistrée');
    }

    /**
     * Affiche la table des tokens liés aux adresses IP
     * @return \Illuminate\Contracts\View\View admin.adresseIpToken
     * @method GET
     */
    public function adresseIpToken(Request $request)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des adresse IP Token {adresseIpToken}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';
        $perPage = $request->query('perPage') ?? 20;

        $nbAdresseIpToken = DB::table('adresse_ips_tokens')->count();
        $adresseIpTokens = DB::table('adresse_ips_tokens')->orderBy($sort, $order)->paginate($perPage);
        return view('admin.adresseIpToken', compact('nbAdresseIpToken', 'adresseIpTokens', 'perPage'));
    }



    /*============================*/
    /* Affichage des Utilisateurs */
    /*============================*/
    /**
     * Affiche la table des utilisateurs
     * @return \Illuminate\Contracts\View\View admin.users
     * @method GET
     */
    public function users(Request $request)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des users {users}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';
        $perPage = $request->query('perPage') ?? 20;

        $nbUser = User::count();
        $users = User::orderBy($sort, $order)->paginate($perPage);
        return view('admin.users', compact('nbUser', 'users', 'perPage'));
    }



    /*======================*/
    /* Affichage des Outils */
    /*======================*/
    /**
     * Affiche la table des outils
     * @return \Illuminate\Contracts\View\View admin.tools
     * @method GET
     */
    public function tools(Request $request)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des tools {tools}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';
        $perPage = $request->query('perPage') ?? 20;

        $nbTool = Tools::count();
        $tools = Tools::orderBy($sort, $order)->paginate($perPage);
        return view('admin.tools', compact('nbTool', 'tools', 'perPage'));
    }



    /*====================*/
    /* Affichage des Logs */
    /*====================*/
    /**
     * Affiche la page des logs
     * @param Request $request
     * @return \Illuminate\View\View logs.logListe
     * @method GET
     */
    public function showListeLogs(Request $request)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des logs {showListeLogs}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';
        $perPage = $request->query('perPage') ?? 20;

        $nbLogs = Log::count();
        $logs = Log::orderBy($sort, $order)->paginate($perPage);
        return view('admin.logListe', compact('logs', 'nbLogs', 'perPage'));
    }

    /**
     * Affiche la page d'un log
     * @param int $id
     * @return \Illuminate\View\View logs.logDetails
     * @method GET
     */
    public function showDetailsLog($id)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            LogController::addLog("Queslqu'un à essayer d'accéder à la page de détails du log n°$id {showDetailsLog}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $log = Log::where('id', $id)->first();
        if ($log == null) { return back()->with('error', 'Le log n\'existe pas'); }
        return view('admin.logDetails', compact('log'));
    }
}
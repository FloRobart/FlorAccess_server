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


class AdminController extends Controller
{
    /**
     * Affiche la table des adresses IP
     * @param Request $request
     * @return \Illuminate\Contracts\View\View
     * @method GET
     */
    public function adresseIp(Request $request)
    {
        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';

        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL_2')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des adresse IP {adresseIp}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $nbAdresseIp = AdresseIp::count();
        $adresseIps = AdresseIp::orderBy($sort, $order)->paginate(20);
        return view('admin.adresseIp', compact('nbAdresseIp', 'adresseIps'));
    }

    /**
     * Enregistre une adresse IP
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse back() | avec un message d'erreur
     * @method POST
     */
    public function adresseIpSave(Request $request)
    {
        
    }

    /**
     * Affiche la table des tokens liés aux adresses IP
     * @return \Illuminate\Contracts\View\View
     * @method GET
     */
    public function adresseIpToken(Request $request)
    {
        
    }

    /**
     * Affiche la table des utilisateurs
     * @return \Illuminate\Contracts\View\View
     * @method GET
     */
    public function users(Request $request)
    {
        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';

        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL_2')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des adresse IP {adresseIp}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $nbUser = User::count();
        $users = User::orderBy($sort, $order)->paginate(20);
        return view('admin.users', compact('nbUser', 'users'));
    }

    /**
     * Affiche la table des outils
     * @return \Illuminate\Contracts\View\View
     * @method GET
     */
    public function tools(Request $request)
    {
        $sort = $request->query('sort') ?? 'id';
        $order = $request->query('order') ?? 'desc';

        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL_2')) {
            LogController::addLog("Quelqu'un à essayer d'accéder à la page des adresse IP {adresseIp}", Auth::check() ? Auth::user()->id : null, 2);
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $nbTool = Tools::count();
        $tools = Tools::orderBy($sort, $order)->paginate(20);
        return view('admin.tools', compact('nbTool', 'tools'));
    }
}
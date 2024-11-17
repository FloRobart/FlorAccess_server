<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Models\Log;
use Illuminate\Support\Facades\Auth;
use App\Mail\LogError;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;


class LogController extends Controller
{
    /*--------------------*/
    /* Affichage des logs */
    /*--------------------*/
    /**
     * Affiche la page des logs
     * @param Request $request
     * @return \Illuminate\View\View logs.logListe
     */
    public function showListeLogs(Request $request)
    {
        $sort = $request->query('sort') ?? 'created_at';
        $order = $request->query('order') ?? 'desc';

        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            Mail::to(env('MAIL_FROM_ADDRESS'))->send(new LogError(Log::all()->sortByDesc('created_at')->first()));
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $nbLogs = Log::count();
        $logs = Log::orderBy($sort, $order)->paginate(20);
        return view('logs.logListe', compact('logs', 'nbLogs'));
    }

    /**
     * Affiche la page d'un log
     * @param int $id
     * @return \Illuminate\View\View logs.logDetails
     */
    public function showDetailsLog($id)
    {
        if (!Auth::check() || Auth::user()->email != env('ADMIN_EMAIL')) {
            Mail::to(env('MAIL_FROM_ADDRESS'))->send(new LogError(Log::all()->sortByDesc('created_at')->first()));
            return back()->with('error', 'Vous n\'avez pas les droits pour accéder à cette page, cette évènement a été signalé à l\'administrateur');
        }

        $log = Log::where('id', $id)->first();
        if ($log == null) { return back()->with('error', 'Le log n\'existe pas'); }
        return view('logs.logDetails', compact('log'));
    }



    /*-------------------------*/
    /* Enregistrement des logs */
    /*-------------------------*/
    /**
     * Permets d'ajouter un log
     * @param string $message
     * @param string|null $user_id l'id de l'utilisateur qui a effectué l'action (si l'utilisateur est connecté, il est automatiquement ajouté)
     * @param int|null $error 1 si c'est une erreur, 0 si c'est une information ou un succès
     * @return void
     */
    public static function addLog(string $message, ?string $user_id = null, ?int $error = 0): void
    {
        $user_id = $user_id ?? (Auth::check() ? Auth::user()->id : null);

        $log = new Log();
        $log->host = $_SERVER['HTTP_HOST'];
        $log->user_id = $user_id;
        $log->ip = request()->ip();
        $log->link_from = $_SERVER['HTTP_REFERER'] ?? null;
        $log->link_to = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $log->method_to = $_SERVER['REQUEST_METHOD'];
        $log->user_agent = $_SERVER['HTTP_USER_AGENT'];
        $log->message = $message;
        $log->status = $error;

        /* Vérification que le log est différent du dernier log */
        $lastLog = Log::all()->sortByDesc('created_at')->first();
        if ($lastLog != null && $lastLog->status == $log->status && $lastLog->user_id == $log->user_id && $lastLog->ip == $log->ip && $lastLog->link_to == $log->link_to && $lastLog->method_to == $log->method_to) {
            return;
        }

        if (!$log->save()) {
            Mail::to(env('MAIL_FROM_ADDRESS'))->send(new LogError($log));
        }

        if ($error == 1) {
            Mail::to(env('MAIL_FROM_ADDRESS'))->send(new LogError($log));
        }
    }
}
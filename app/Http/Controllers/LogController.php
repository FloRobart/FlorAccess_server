<?php
namespace App\Http\Controllers;

/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Models\Log;
use Illuminate\Support\Facades\Auth;
use App\Mail\LogError;
use Illuminate\Support\Facades\Mail;


class LogController extends Controller
{
    /**
     * Permets d'ajouter un log
     * @param string $message
     * @param string|null $user_id l'id de l'utilisateur qui a effectué l'action (si l'utilisateur est connecté, il est automatiquement ajouté)
     * @param int|null $error 1 si c'est une erreur, 0 si c'est une information ou un succès
     * @return void
     */
    public static function addLog(string $message, ?string $user_id = null, ?int $error = 0): void
    {
        $user_id = $user_id == null ? (Auth::check() ? Auth::user()->id : null) : null;

        $log = new Log();
        $log->app = env('APP_NAME_REAL');
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
        $lastLog = Log::all()->sortByDesc('id')->first();
        if ($lastLog != null && $lastLog->status == $log->status && $lastLog->user_id == $log->user_id && $lastLog->ip == $log->ip && $lastLog->link_to == $log->link_to && $lastLog->method_to == $log->method_to) {
            return;
        }

        if (env('APP_ENV') == 'production')
        {
            if (!$log->save())
            {
                $log->message = "Erreur lors de l'enregistrement du log : $log->message";
                Mail::to(env('ADMIN_EMAIL'))->send(new LogError($log));
            }
            if ($error == 2) { Mail::to(env('ADMIN_EMAIL'))->send(new LogError($log)); }
        }
        else
        {
            $log->save();
        }
    }
}
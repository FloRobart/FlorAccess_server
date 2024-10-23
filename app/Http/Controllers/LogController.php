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
        $user_id = $user_id ?? Auth::check() ? Auth::user()->id : null;

        $log = new Log();
        $log->host = $_SERVER['HTTP_HOST'];
        $log->user_id = $user_id;
        $log->ip = request()->ip();
        $log->link_from = $_SERVER['HTTP_REFERER'];
        $log->link_to = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        $log->method_to = $_SERVER['REQUEST_METHOD'];
        $log->user_agent = $_SERVER['HTTP_USER_AGENT'];
        $log->message = $message;
        $log->status = $error;

        if (!$log->save()) {
            Mail::to(env('MAIL_FROM_ADDRESS'))->send(new LogError($log));
        }
    }
}
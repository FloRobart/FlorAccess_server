<?php

use App\Http\Controllers\LogController;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpFoundation\Response;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // $exceptions->respond(function (Response $response) {
        //     LogController::addLog('Une erreur critique est survenue', null, 1);
        //     if (env('APP_ENV') == 'local') {
        //         return $response;
        //     }

        //     return Redirect()->route('accueil')->with('error', 'La page demandée à rencontrée une erreur. L\'administrateur à été informé du problème et travail à le résoudre. Vous serez contacter quand le problème sera résolu.');
        // });
    })->create();

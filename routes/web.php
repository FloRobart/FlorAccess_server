<?php

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Http\Controllers\ProfilController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\PrivateController;
use App\Http\Controllers\ResetPasswordController;
use App\Http\Controllers\LogController;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\VerifIP;



/*----------------------------------------------------------------*/
/* Route pour les pages qui ne nécessitent pas d'authentification */
/*                        PublicController                        */
/*----------------------------------------------------------------*/
/* Accueil */ // L'accueil permet de se connecter et de s'inscrire
Route::get('/', [PublicController::class, 'accueil'])->name('accueil');
Route::get('/accueil', [PublicController::class, 'accueil'])->name('public.accueil');
Route::get('/accueil', [PublicController::class, 'accueil'])->name('login');



/*---------------------------------*/
/* Route pour la gestion du profil */
/*        ProfilController         */
/*---------------------------------*/
/* Inscription */
Route::get('/inscription', [ProfilController::class, 'inscription'])->name('inscription');
Route::post('/inscription', [ProfilController::class, 'inscriptionSave'])->name('inscriptionSave');

/* Connexion */
Route::post('/connexion', [ProfilController::class, 'connexionSave'])->middleware('throttle:5,1')->name('connexionSave'); // 5 tentatives de connexion par minute, puis blocage pendant 1 minute
Route::get('/add/ip/{token}/{ip}', [ProfilController::class, 'addIp'])->name('addIp'); // Ajout d'une adresse IP à la liste blanche

/* Adresse IP */


/* Profil */
Route::get('/profil', [ProfilController::class, 'profil'])->middleware(['auth', VerifIP::class])->name('profil');
Route::post('/profil', [ProfilController::class, 'profilSave'])->middleware(['auth', VerifIP::class])->name('profilSave');

/* Déconnexion */
Route::get('/deconnexion', [ProfilController::class, 'deconnexion'])->middleware(['auth', VerifIP::class])->name('deconnexion');

/* Suppression de compte */
Route::get('/supprimerCompte', [ProfilController::class, 'supprimerCompte'])->middleware(['auth', VerifIP::class])->name('supprimerCompte');



/*------------------------------------------------*/
/* Route pour la réinitialisation du mot de passe */
/*            ResetPasswordController             */
/*------------------------------------------------*/
/* Réinitialisation du mot de passe */
Route::middleware(['guest'])->group(function () {
    Route::get('/resetPassword/emailRequest', [ResetPasswordController::class, 'emailRequest'])->name('resetPassword.emailRequest');
    Route::post('/resetPassword/emailRequest', [ResetPasswordController::class, 'emailRequestSave'])->name('resetPassword.emailRequestSave');
    Route::get('/resetPasswordSave/{token}', [ResetPasswordController::class, 'resetPassword'])->name('password.reset'); // Ne surtout pas changer le nom ni l'URL de cette route
    Route::post('/resetPasswordSave', [ResetPasswordController::class, 'resetPasswordSave'])->name('password.reset.save');
});



/*-----------------------------*/
/* Route pour les utilisateurs */
/*      PrivateController      */
/*-----------------------------*/
Route::middleware(['auth', VerifIP::class])->group(function () {
    /* Affichage de la page d'accueil */
    Route::get('/private/accueil', [PrivateController::class, 'accueil'])->name('private.accueil');

    /* Gestion des outils */
    Route::post('/private/tool/add', [PrivateController::class, 'addTool'])->name('private.tool.add');
    Route::post('/private/tool/edit', [PrivateController::class, 'editTool'])->name('private.tool.edit');
    Route::get('/private/tool/move/{id}/{new_position}', [PrivateController::class, 'moveTool'])->name('private.tool.move');
    Route::get('/private/tool/remove/{id}', [PrivateController::class, 'deleteTool'])->name('private.tool.remove');

    /* Affichage des logs, uniquement pour l'administrateur */
    Route::get('/private/logs', [LogController::class, 'showListeLogs'])->name('private.logs');
    Route::get('/private/log/{id}', [LogController::class, 'showDetailsLog'])->name('private.log.details');
});
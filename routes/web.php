<?php

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Http\Controllers\ProfilController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\PrivateController;
use App\Http\Controllers\ResetPasswordController;
use Illuminate\Support\Facades\Route;



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

/* Profil */
Route::get('/profil', [ProfilController::class, 'profil'])->middleware('auth')->name('profil');
Route::post('/profil', [ProfilController::class, 'profilSave'])->middleware('auth')->name('profilSave');

/* Connexion */
Route::post('/connexion', [ProfilController::class, 'connexionSave'])->middleware('throttle:5,1')->name('connexionSave'); // 5 tentatives de connexion par minute, puis blocage pendant 1 minute
Route::post('/connexionPost', [ProfilController::class, 'connexionPost'])->name('connexionPost');

/* Déconnexion */
Route::get('/deconnexion', [ProfilController::class, 'deconnexion'])->middleware('auth')->name('deconnexion');

/* Suppression de compte */
Route::get('/supprimerCompte', [ProfilController::class, 'supprimerCompte'])->middleware('auth')->name('supprimerCompte');



/*------------------------------------------------*/
/* Route pour la réinitialisation du mot de passe */
/*            ResetPasswordController             */
/*------------------------------------------------*/
/* Réinitialisation du mot de passe */
Route::get('/resetPassword/emailRequest', [ResetPasswordController::class, 'emailRequest'])->middleware('guest')->name('resetPassword.emailRequest');
Route::post('/resetPassword/emailRequest', [ResetPasswordController::class, 'emailRequestSave'])->middleware('guest')->name('resetPassword.emailRequestSave');
Route::get('/resetPasswordSave/{token}', [ResetPasswordController::class, 'resetPassword'])->middleware('guest')->name('password.reset'); // Ne surtout pas changer le nom ni l'URL de cette route
Route::post('/resetPasswordSave', [ResetPasswordController::class, 'resetPasswordSave'])->middleware('guest')->name('password.reset.save');



/*-----------------------------*/
/* Route pour les utilisateurs */
/*      PrivateController      */
/*-----------------------------*/
Route::get('/private/accueil', [PrivateController::class, 'accueil'])->middleware('auth')->name('private.accueil');

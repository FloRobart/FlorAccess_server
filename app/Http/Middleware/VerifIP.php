<?php
namespace App\Http\Middleware;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AdresseIP;

class VerifIP
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip();
        $adresseIP = AdresseIP::where('adresse_ip', $ip)->first();
        if ($adresseIP != null && $adresseIP->est_bannie == 1) {
            return redirect()->route('accueil')->with('error', 'Vous avez été bannie, en continuant vous vous exposez à des poursuites judiciaires');
        }

        return $next($request);
    }
}

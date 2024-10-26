<?php

namespace App\Http\Middleware;

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
            return redirect()->route('private.accueil')->with('error', 'Votre adresse IP a été bannie, en continuant vous vous exposez à des poursuites judiciaires');
        }

        return $next($request);
    }
}

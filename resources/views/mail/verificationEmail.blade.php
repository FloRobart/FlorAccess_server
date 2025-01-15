<h1 class="text-center titleTextBleuLogo font-bold rounded-xl">Vérification de votre adresse e-mail</h1>
<h3 class="text-center">Bonjour {{ (auth()::check() ? auth()::user()->name : 'Monsieur') }} ,</h3>
<h4 class="text-center">Merci de vous être inscrit sur {{ env('APP_NAME_REAL') }}</h4>
<h4 class="text-center">Voici votre code de vérification</h4>
<h1 class="custom-container">{{ $this->code }}</h1>
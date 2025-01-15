{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<h1> {{ $data['message'] }}</h1>
<p>ID : {{ $data['id'] }}</p>
<p>App : {{ $data['app'] }}</p>
<p>Host : {{ $data['host'] }}</p>
<p>Utilisateur id : {{ $data['user_id'] }}</p>
<p>Utilisateur name : {{ ($data['user_id'] != null ? \App\Models\User::find($data['user_id'])->name : 'Utilisateur non connecté') }}</p>
<p>Utilisateur email : {{ ($data['user_id'] != null ? \App\Models\User::find($data['user_id'])->email : 'Utilisateur non connecté') }}</p>
<p>IP : {{ $data['ip'] }}</p>
<p>Lien de provenance : {{ $data['link_from'] }}</p>
<p>Lien de destination : {{ $data['link_to'] }}</p>
<p>Méthode : {{ $data['method_to'] }}</p>
<p>User Agent : {{ $data['user_agent'] }}</p>
<p>Message : {{ $data['message'] }}</p>
<p>Status : {{ $data['status'] }}</p>
<p>Date : {{ $data['created_at'] }}</p>
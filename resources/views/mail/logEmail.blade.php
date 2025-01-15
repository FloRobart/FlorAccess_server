{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<h1> {{ $this->data->message }}</h1>
<p>ID : {{ $this->data->id }}</p>
<p>App : {{ $this->data->app }}</p>
<p>Host : {{ $this->data->host }}</p>
<p>Utilisateur id : {{ $this->data->user_id }}</p>
<p>Utilisateur name : {{ ($this->data->user_id != null ? \App\Models\User::find($this->data->user_id)->name : 'Utilisateur non connecté') }}</p>
<p>Utilisateur email : {{ ($this->data->user_id != null ? \App\Models\User::find($this->data->user_id)->email : 'Utilisateur non connecté') }}</p>
<p>IP : {{ $this->data->ip }}</p>
<p>Lien de provenance : {{ $this->data->link_from }}</p>
<p>Lien de destination : {{ $this->data->link_to }}</p>
<p>Méthode : {{ $this->data->method_to }}</p>
<p>User Agent : {{ $this->data->user_agent }}</p>
<p>Message : {{ $this->data->message }}</p>
<p>Status : {{ $this->data->status }}</p>
<p>Date : {{ date_format($this->data->created_at, 'd/m/Y H:i:s') }}</p>
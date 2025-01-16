{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $data['message'] }}</title>
</head>

<!-- Corps de l'email -->
<body style="font-family: 'Poppins', Arial, sans-serif">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 20px;">
                <table class="content" width="600" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #721414;">
                    <!-- Entête de l'email -->
                    <tr>
                        <td class="header" style="background-color: #721414; padding: 40px; text-align: center; color: white; font-size: 24px;">
                            {{ $data['message'] }}
                        </td>
                    </tr>

                    <!-- Contenu de l'email -->
                    <tr>
                        <td class="body" style="padding: 40px; text-align: left; font-size: 16px; line-height: 1.6;">
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
                        </td>
                    </tr>

                    <!-- Footer de l'email -->
                    <tr>
                        <td class="footer" style="background-color: #333333; padding: 40px; text-align: center; color: white; font-size: 14px;">
                            <span>Copyright © 2024 - <script>document.write(new Date().getFullYear())</script>
                            <a href="https://florobart.github.io/" target="_blank"><b>Floris Robart</b></a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
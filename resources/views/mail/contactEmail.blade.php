{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
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
                            {{ $subject }}
                        </td>
                    </tr>

                    <!-- Contenu de l'email -->
                    <tr>
                        <td class="body" style="padding: 40px; text-align: left; font-size: 16px; line-height: 1.6;">
                            Message de : <b>{{ $name }} </b><br>
                            Email : <b>{{ $email }} </b><br>
                            Utilisateur id :
                            <b>
                            @if (auth()->check())
                                {{ auth()->user()->id }}
                            @else
                                Non connecté
                            @endif
                            </b>
                            <br><br><hr>
                            <pre>{{ $messages }}</pre>
                        <td>
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
{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation de l'e-mail</title>
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
                            Validation de l'e-mail
                        </td>
                    </tr>

                    <!-- Contenu de l'email -->
                    <tr>
                        <td class="body" style="padding: 40px; text-align: left; font-size: 16px; line-height: 1.6;">
                            <h1 class="text-center titleTextBleuLogo font-bold rounded-xl">Vérification de votre adresse e-mail</h1>
                            <h3 class="text-center">Bonjour {{ $nom }} ,</h3>
                            <h4 class="text-center">Merci de vous être inscrit sur {{ env('APP_NAME_REAL') }}</h4>
                            <h4 class="text-center">Voici votre code de vérification</h4>
                            <h1 class="custom-container">{{ $code }}</h1>
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
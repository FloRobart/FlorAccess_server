{{--
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
--}}

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validation de l'IP</title>
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
                            Validation de l'IP
                        </td>
                    </tr>

                    <!-- Contenu de l'email -->
                    <tr>
                        <td style="padding: 0px 40px 0px 40px; text-align: center;">
                            <h1>Validation de l'IP</h1>
                            <p>Vous avez essayé de vous connecter à votre compte FlorAccess depuis un nouvel appareil ou un nouvel emplacement.</p>
                            <p>Si vous êtes bien à l'origine de cette demande, veuillez cliquer sur le bouton ci-dessous pour valider votre adresse IP.</p>
                            <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>

                            <table cellspacing="0" cellpadding="0" style="margin: auto;">
                                <tr>
                                    <td align="center" style="background-color: #721414; padding: 10px 20px; border-radius: 5px;">
                                        <a href="{{ route('addIp', ['token' => $data['token'], 'ip' => $data['ip']]) }}" style="color: #ffffff; text-decoration: none; font-weight: bold;">Cliquez ici pour validé qu'il s'agit bien de vous</a>
                                    </td>
                                </tr>
                            </table>
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
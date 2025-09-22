/**
 * Generates the HTML template for the token email.
 * @param appName Name of the application to be used in the email subject
 * @param route The route to be included in the email
 * @returns The HTML template as a string
 */
export const htmlTokenEmailTemplate = (appName: string, route: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connexion avec ${appName}</title>
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
                                Connexion avec ${appName}
                            </td>
                        </tr>

                        <!-- Contenu de l'email -->
                        <tr>
                            <td style="padding: 0px 40px 0px 40px; text-align: center;">
                                <h1>Connexion avec ${appName}</h1>
                                <p>Confirmer votre connexion en cliquant sur le bouton ci-dessous pour vous connecter.</p>
                                <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>

                                <table cellspacing="0" cellpadding="0" style="margin: auto;">
                                    <tr>
                                        <td align="center" style="background-color: #721414; padding: 10px 20px; border-radius: 5px;">
                                            <a href="${route}" style="color: #ffffff; text-decoration: none; font-weight: bold;">Cliquez ici pour validé votre connexion à ${appName}</a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin-top: 20px;">Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
                                <p style="word-break: break-all;">${route}</p>
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
    </html>`;
}


/**
 * Generates the HTML template for the code email.
 * @param appName Name of the application to be used in the email subject
 * @param code The code to be included in the email
 * @returns The HTML template as a string
 */
export const htmlCodeEmailTemplate = (appName: string, code: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connexion avec ${appName}</title>
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
                                Connexion avec ${appName}
                            </td>
                        </tr>

                        <!-- Contenu de l'email -->
                        <tr>
                            <td style="padding: 0px 40px 0px 40px; text-align: center;">
                                <h1>Connexion avec ${appName}</h1>
                                <p>Confirmer votre connexion en copiant le code suivant :</p>
                                <p style="font-weight: bold;font-size: 32px;">${code.toString().replace(/(\d{2})(?=\d)/g, '$1 ')}</p>
                                <p>Collez ce code dans l'application pour vous connecter.</p>

                                <br>

                                <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
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
    </html>`;
}
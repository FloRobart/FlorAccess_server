import config from '../config/config';
import sendEmail from './mailer';



/**
 * Sends an email for user connection verification.
 * This function sends an email to the user with a link to verify their connection.
 * @param to Email address of the recipient
 * @param app_name Name of the application to be used in the email subject
 * @param token Authentication token to be included in the verification link
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */ 
export async function sendEmailConnexion(to: string, app_name: string, token: string): Promise<void> {
    const route = `${config.base_url}/jwt?email=${encodeURI(to)}&token=${encodeURI(token)}`;
    const appName = app_name || config.app_name;

    const html = `
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
        </html>
    `;

    sendEmail(to, `Connexion avec ${appName}`, html);
}
/* Génération du mot de passe */
function passwordGenerator()
{
    /* Définition des variables */
    var passwordInput = document.getElementById("password");
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var passwordLength = Math.floor(Math.random() * 4) + 10;
    var password = "";

    /* Génération du mot de passe */
    for (var i = 0; i <= passwordLength; i++)
    {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber +1);
    }

    /* Écriture du mot de passe */
    passwordInput.value = password;
}
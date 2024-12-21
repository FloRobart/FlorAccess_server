/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florisrobart.pro@gmail.com>
 */

/* Affichage du mot de passe */
function showPassword()
{
    /* Définition des variables */
    /* Input password */
    var passwordInput1 = document.getElementById("password");
    var passwordInput2 = document.getElementById("password_confirmation");

    /* SVG eyes open */
    var svgEyeOpen1 = document.getElementById("svgEyeOpen1");
    var svgEyeOpen2 = document.getElementById("svgEyeOpen2");

    /* SVG eyes close */
    var svgEyeClose1 = document.getElementById("svgEyeClose1");
    var svgEyeClose2 = document.getElementById("svgEyeClose2");

    /* Affichage du mot de passe + modification de l'icône */
    if (passwordInput1.type === "password")
    {
        /* Affichage du mot de passe */
        passwordInput1.type = "text";
        svgEyeOpen1.classList.remove("hidden");
        svgEyeClose1.classList.add("hidden");
        
        if (passwordInput2 !== null)
        {
            passwordInput2.type = "text";
            svgEyeOpen2.classList.remove("hidden");
            svgEyeClose2.classList.add("hidden");
        }
    }
    else
    {
        /* Masquage du mot de passe */
        passwordInput1.type = "password";
        svgEyeOpen1.classList.add("hidden");
        svgEyeClose1.classList.remove("hidden");
        
        if (passwordInput2 !== null)
        {
            passwordInput2.type = "password";
            svgEyeOpen2.classList.add("hidden");
            svgEyeClose2.classList.remove("hidden");
        }
    }
}
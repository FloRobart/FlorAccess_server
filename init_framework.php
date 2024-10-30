<?php

// Crée les dossiers nécessaires
function createDirectory($path) {
    if (!file_exists($path)) {
        mkdir($path, 0777, true);  // 0777 donne les permissions complètes, true permet de créer les sous-dossiers
        echo "Created directory: $path\n";
    } else {
        echo "Directory already exists: $path\n";
    }
}

// Liste des répertoires à créer
$directories = [
    './storage/framework',
    './storage/framework/cache',
    './storage/framework/sessions',
    './storage/framework/views'
];

// Boucle pour créer chaque répertoire
foreach ($directories as $directory) {
    createDirectory($directory);
}

?>

<?php
namespace App\Livewire;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use Livewire\Component;

class CardProduit extends Component
{
    public $produit;

    public function render()
    {
        return view('livewire.card-produit');
    }
}

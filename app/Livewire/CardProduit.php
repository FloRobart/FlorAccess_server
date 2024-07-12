<?php

namespace App\Livewire;

use Livewire\Component;

class CardProduit extends Component
{
    public $produit;

    public function render()
    {
        return view('livewire.card-produit');
    }
}

<?php

namespace App\Livewire;

use Livewire\Component;

class PageTitle extends Component
{
    public $title;

    public function render()
    {
        return view('livewire.page-title');
    }
}

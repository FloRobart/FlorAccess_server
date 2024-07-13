<?php

namespace App\Livewire;

use Livewire\Component;

class BreadcrumbLink extends Component
{
    public $link;
    public $name;

    public function render()
    {
        return view('livewire.breadcrumb-link');
    }
}

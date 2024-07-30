<?php
namespace App\Livewire;

/*
 * Ce fichier fait partie du projet Home Server Maison
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

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

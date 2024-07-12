<?php

namespace App\Livewire;

use Livewire\Component;

class PasswordInput extends Component
{
    public $confirmation;
    public $newPassword;

    public function render()
    {
        return view('livewire.password-input');
    }
}

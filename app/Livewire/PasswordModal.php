<?php

namespace App\Livewire;

use Livewire\Component;

class PasswordModal extends Component
{
    public $email;
 
    public function render()
    {
        return view('livewire.password-modal');
    }
}

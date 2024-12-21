<?php
namespace App\Mail;

/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Support\Facades\Auth;


class VerificationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $code;

    /**
     * Crée une nouvelle instance de message.
     */
    public function __construct($code)
    {
        $this->code = $code;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('ADMIN_EMAIL'), env('MAIL_NAME')),
            subject: 'Verification de votre compte - ' . env('APP_NAME_REAL'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = '<h1 class="text-center titleTextBleuLogo font-bold rounded-xl">Vérification de votre adresse e-mail</h1>';
        $message .= '<h3 class="text-center">Bonjour ' . (Auth::check() ? Auth::user()->name : 'Monsieur') . ',</h3>';
        $message .= '<h1 class="custom-container">' . $this->code . '</h1>';
        $message .= '<h4 class="text-center">Merci de vous être inscrit sur ' . env('APP_NAME_REAL') . '.</h4>';

        return new Content(
            htmlString: $message
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

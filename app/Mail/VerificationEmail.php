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
    public $nom;

    /**
     * Crée une nouvelle instance de message.
     */
    public function __construct($code)
    {
        $this->code = $code;
        $this->nom = Auth::check() ? Auth::user()->name : 'Monsieur';
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS'), env('MAIL_NAME'))
                    ->subject(env('APP_NAME_REAL') . ' - Vérification de votre compte')
                    ->view('mail.verificationEmail', ['nom' => $this->nom, 'code' => $this->code]);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS'), env('MAIL_NAME')),
            subject: env('APP_NAME_REAL') . ' - Vérification de votre compte',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.verificationEmail',
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

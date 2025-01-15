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


class AddIpEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    /**
     * Crée une nouvelle instance de message.
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->from(env('MAIL_FROM_ADDRESS'), env('MAIL_NAME'))
                    ->subject(env('APP_NAME_REAL') . ' - Vérification de votre adresse IP')
                    ->view('mail.addIpEmail', $this->data);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS'), env('MAIL_NAME')),
            subject: env('APP_NAME_REAL') . ' - Vérification de votre adresse IP',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.addIpEmail',
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

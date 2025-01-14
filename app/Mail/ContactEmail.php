<?php
namespace App\Mail;

/**
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;


class ContactEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    /**
     * Create a new messages instance.
     * @param string $nom Nom de l'expéditeur
     * @param string $mail Adresse mail de l'expéditeur
     * @param string $sujet Sujet du messages
     * @param string $message Contenu du message
     */
    public function __construct(string $nom, string $mail, string $sujet, string $message)
    {
        $this->data = [
            'name' => $nom,
            'mail' => $mail,
            'subject' => $sujet,
            'message' => $message,
        ];
    }

    /**
     * Build the messages.
     */
    public function build()
    {
        return $this->from($this->data['mail'], $this->data['name'])
                    ->subject($this->data['subject'])
                    ->view('mail.contactEmail', ['name' => $this->data['name'], 'mail' => $this->data['mail'], 'messages' => $this->data['message']]);
    }

    /**
     * Get the messages envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->data['mail'], $this->data['name']),
            subject: env('APP_NAME_REAL') . ' - ' . $this->data['subject'],
        );
    }

    /**
     * Get the messages content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.contactEmail',
        );
    }

    /**
     * Get the attachments for the messages.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

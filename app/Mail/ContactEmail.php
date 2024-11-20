<?php
namespace App\Mail;

/**
 * Ce fichier fait partie du projet Home Server Maison
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

    public $depuis;
    public $sujet;
    public $messages;
    public $nom;

    /**
     * Create a new messages instance.
     */
    public function __construct(string $from, string $subject, string $message, ?string $name = 'Invité')
    {
        $this->depuis = $from;
        $this->sujet = $subject;
        $this->messages = $message;
        $this->nom = $name;
    }

    /**
     * Build the messages.
     */
    public function build()
    {
        return $this->from($this->depuis, $this->nom) // L'expéditeur
                    ->subject($this->sujet) // Le sujet
                    ->view('mail.contactEmail', ['depuis' => $this->depuis, 'messages' => $this->messages]); // La vue
    }

    /**
     * Get the messages envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->depuis, $this->nom),
            subject: 'Home Server Maison - ' . $this->sujet,
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

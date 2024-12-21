<?php
namespace App\Mail;

/*
 * Ce fichier fait partie du projet FlorAccess
 * Copyright (C) 2024 Floris Robart <florobart.github@gmail.com>
 */

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;


class LogError extends Mailable
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
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('MAIL_FROM_ADDRESS'), env('MAIL_NAME')),
            subject: 'Erreur critique - FlorAccess',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "<h1>" . $this->data->message . "</h1>";
        $message .= "<p>Host : " . $this->data->host . "</p>";
        $message .= "<p>Utilisateur id : " . $this->data->user_id . "</p>";
        $message .= "<p>Utilisateur name : " . ($this->data->user_id != null ? User::find($this->data->user_id)->name : 'Utilisateur non connecté') . "</p>";
        $message .= "<p>Utilisateur email : " . ($this->data->user_id != null ? User::find($this->data->user_id)->email : 'Utilisateur non connecté') . "</p>";
        $message .= "<p>IP : " . $this->data->ip . "</p>";
        $message .= "<p>Lien de provenance : " . $this->data->link_from . "</p>";
        $message .= "<p>Lien de destination : " . $this->data->link_to . "</p>";
        $message .= "<p>Méthode : " . $this->data->method_to . "</p>";
        $message .= "<p>User Agent : " . $this->data->user_agent . "</p>";
        $message .= "<p>Message : " . $this->data->message . "</p>";
        $message .= "<p>Status : " . $this->data->status . "</p>";
        $message .= "<p>Date : " . date_format($this->data->created_at,"d/m/Y H:i:s") . "</p>";

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

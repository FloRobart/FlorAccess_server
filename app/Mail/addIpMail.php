<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\View\View;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class addIpMail extends Mailable
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
            subject: 'Vérification de votre compte - Home Server Maison',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = "<!DOCTYPE html>
                <html>
                <head>
                    <title>Email personnalisé</title>
                </head>
                <body>
                    <h1>Validation de l'email</h1>
                    <p>".route('addIp', ['token' => $this->data['token'], 'ip' => $this->data['ip']])."</p>
                </body>
                </html>";
        return new Content(
            htmlString: $view,
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

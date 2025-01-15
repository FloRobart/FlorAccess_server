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
     * Build the message.
     */
    public function build()
    {
        return $this->from(env('ADMIN_EMAIL'), env('ADMIN_EMAIL'))
                    ->subject(env('APP_NAME_REAL') . ' - ' . $this->data->message)
                    ->view('mail.logEmail', $this->data);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address(env('ADMIN_EMAIL'), env('MAIL_NAME')),
            subject: env('APP_NAME_REAL') . ' - ' . $this->data->message,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'mail.logEmail',
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

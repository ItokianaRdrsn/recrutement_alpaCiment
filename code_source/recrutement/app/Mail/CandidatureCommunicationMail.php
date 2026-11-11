<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CandidatureCommunicationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $emailSubject;
    public string $emailContent;
    public ?string $candidatNom;

    /**
     * Create a new message instance.
     */
    public function __construct(string $emailSubject, string $emailContent, ?string $candidatNom = null)
    {
        $this->emailSubject = $emailSubject;
        $this->emailContent = $emailContent;
        $this->candidatNom = $candidatNom;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->emailSubject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.candidature_communication',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}

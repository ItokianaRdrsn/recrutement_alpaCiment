<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Foundation\Http\FormRequest;

class PostulerOffreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['required', 'file', 'max:10240'], // max 10MB
            'photo' => ['nullable', 'file', 'image', 'max:5120'], // max 5MB
            'documents.*' => ['nullable', 'file', 'max:10240'],
        ];
    }
}

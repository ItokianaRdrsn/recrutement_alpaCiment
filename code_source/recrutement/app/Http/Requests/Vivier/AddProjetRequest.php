<?php

namespace App\Http\Requests\Vivier;

use Illuminate\Foundation\Http\FormRequest;

class AddProjetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titre_projet' => ['required', 'string', 'max:200'],
            'role' => ['nullable', 'string', 'max:150'],
            'technologies' => ['nullable', 'string', 'max:255'],
            'url_projet' => ['nullable', 'string', 'max:255'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'description' => ['nullable', 'string'],
        ];
    }
}

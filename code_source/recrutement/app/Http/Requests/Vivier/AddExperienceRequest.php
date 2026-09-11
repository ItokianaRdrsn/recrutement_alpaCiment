<?php

namespace App\Http\Requests\Vivier;

use Illuminate\Foundation\Http\FormRequest;

class AddExperienceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'poste' => ['nullable', 'string', 'max:200'],
            'intitule_poste' => ['nullable', 'string', 'max:200'],
            'entreprise' => ['nullable', 'string', 'max:200'],
            'date_debut' => ['nullable', 'date'],
            'date_fin' => ['nullable', 'date'],
            'description' => ['nullable', 'string'],
        ];
    }
}

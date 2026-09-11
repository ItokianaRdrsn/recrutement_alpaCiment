<?php

namespace App\Http\Requests\Vivier;

use Illuminate\Foundation\Http\FormRequest;

class ValidateOcrRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'statut_validation' => ['required', 'string', 'in:valide,corrige,rejete'],
            'commentaire_rh' => ['nullable', 'string'],
            'competences' => ['nullable', 'array'],
            'experiences' => ['nullable', 'array'],
            'formations' => ['nullable', 'array'],
        ];
    }
}

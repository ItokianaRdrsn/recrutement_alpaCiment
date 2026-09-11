<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStatutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_statut_candidature' => ['required', 'integer', 'exists:statut_candidature,id_statut_candidature'],
            'commentaire' => ['nullable', 'string'],
        ];
    }
}

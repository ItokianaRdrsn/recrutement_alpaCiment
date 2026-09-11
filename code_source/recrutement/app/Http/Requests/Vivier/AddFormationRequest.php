<?php

namespace App\Http\Requests\Vivier;

use Illuminate\Foundation\Http\FormRequest;

class AddFormationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'diplome' => ['required', 'string', 'max:200'],
            'etablissement' => ['nullable', 'string', 'max:200'],
            'annee_obtention' => ['nullable'],
            'date_obtention' => ['nullable', 'date'],
            'domaine_etude' => ['nullable', 'string', 'max:150'],
            'id_niveau' => ['nullable', 'integer', 'exists:niveau,id_niveau'],
            'niveau' => ['nullable', 'string', 'max:100'],
        ];
    }
}

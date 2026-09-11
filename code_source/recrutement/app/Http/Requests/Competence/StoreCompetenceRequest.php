<?php

namespace App\Http\Requests\Competence;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompetenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom_competence' => ['required', 'string', 'max:150', 'unique:competence,nom_competence'],
            'id_type_competence' => ['required', 'integer', 'exists:type_competence,id_type_competence'],
        ];
    }
}

<?php

namespace App\Http\Requests\Vivier;

use Illuminate\Foundation\Http\FormRequest;

class AddCompetenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_competence' => ['required', 'integer', 'exists:competence,id_competence'],
            'niveau' => ['nullable', 'string', 'max:50'],
        ];
    }
}

<?php

namespace App\Http\Requests\Domaine;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDomaineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $domaineId = $this->route('domaine');
        if (is_object($domaineId)) {
            $domaineId = $domaineId->id_domaine;
        }

        return [
            'nom_domaine' => [
                'required',
                'string',
                'max:150',
                Rule::unique('domaine', 'nom_domaine')->ignore($domaineId, 'id_domaine'),
            ],
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'valide' => ['sometimes', 'boolean'],
        ];
    }
}

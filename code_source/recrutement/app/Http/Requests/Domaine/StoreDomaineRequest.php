<?php

namespace App\Http\Requests\Domaine;

use Illuminate\Foundation\Http\FormRequest;

class StoreDomaineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom_domaine' => ['required', 'string', 'max:150', 'unique:domaine,nom_domaine'],
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'valide' => ['sometimes', 'boolean'],
        ];
    }
}

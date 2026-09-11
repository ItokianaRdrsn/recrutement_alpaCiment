<?php

namespace App\Http\Requests\Vivier;

use Illuminate\Foundation\Http\FormRequest;

class StoreVivierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_candidat' => ['required', 'integer', 'exists:candidat,id_candidat'],
            'id_direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'id_domaine' => ['nullable', 'integer', 'exists:domaine,id_domaine'],
            'motif_ajout' => ['nullable', 'string', 'max:255'],
        ];
    }
}

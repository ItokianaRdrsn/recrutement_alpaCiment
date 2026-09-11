<?php

namespace App\Http\Requests\Direction;

use Illuminate\Foundation\Http\FormRequest;

class StoreDirectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom_direction' => ['required', 'string', 'max:150', 'unique:direction,nom_direction'],
        ];
    }
}

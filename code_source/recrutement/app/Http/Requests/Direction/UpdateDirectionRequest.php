<?php

namespace App\Http\Requests\Direction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDirectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $directionId = $this->route('direction');
        if (is_object($directionId)) {
            $directionId = $directionId->id_direction;
        }

        return [
            'nom_direction' => [
                'required',
                'string',
                'max:150',
                Rule::unique('direction', 'nom_direction')->ignore($directionId, 'id_direction'),
            ],
        ];
    }
}

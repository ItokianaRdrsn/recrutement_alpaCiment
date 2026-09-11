<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Foundation\Http\FormRequest;

class ImportExternalCandidatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'ville' => ['nullable', 'string', 'max:100'],
            'id_offre' => ['nullable', 'integer', 'exists:offre,id_offre'],
            'id_direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'id_domaine' => ['nullable', 'integer', 'exists:domaine,id_domaine'],
            'poste_souhaite' => ['nullable', 'string', 'max:150'],
            'source' => ['nullable', 'string', 'max:100'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'],
        ];
    }
}

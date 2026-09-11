<?php

namespace App\Http\Requests\Offre;

use Illuminate\Foundation\Http\FormRequest;

class StoreOffreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'id_direction' => $this->id_direction ? (int) $this->id_direction : null,
            'id_type_contrat' => $this->id_type_contrat ? (int) $this->id_type_contrat : null,
            'id_statut_offre' => $this->id_statut_offre ? (int) $this->id_statut_offre : null,
            'id_lieu' => $this->id_lieu ? (int) $this->id_lieu : 1,
            'date_publication' => $this->date_publication ?: null,
            'date_limite' => $this->date_limite ?: null,
            'description' => $this->description ? trim($this->description) : null,
            'lieu' => $this->lieu ? trim($this->lieu) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'titre_poste' => ['required', 'string', 'max:200'],
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'description' => ['nullable', 'string'],
            'id_lieu' => ['nullable', 'integer', 'exists:lieu,id_lieu'],
            'lieu' => ['nullable', 'string', 'max:150'],
            'id_type_contrat' => ['nullable', 'integer', 'exists:type_contrat,id_type_contrat'],
            'date_publication' => ['nullable', 'date'],
            'date_limite' => ['nullable', 'date', 'after_or_equal:date_publication'],
            'id_statut_offre' => ['nullable', 'integer', 'exists:statut_offre,id_statut_offre'],
            'profil' => ['nullable', 'array'],
            'profils' => ['nullable', 'array'],
            'missions' => ['nullable', 'array'],
            'formations' => ['nullable', 'array'],
            'competences' => ['nullable', 'array'],
        ];
    }
}

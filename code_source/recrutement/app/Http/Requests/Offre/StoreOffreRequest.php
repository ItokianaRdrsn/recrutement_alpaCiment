<?php

namespace App\Http\Requests\Offre;

use Illuminate\Foundation\Http\FormRequest;

class StoreOffreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_direction' => ['required', 'integer', 'exists:direction,id_direction'],
            'id_type_contrat' => ['required', 'integer', 'exists:type_contrat,id_type_contrat'],
            'id_statut_offre' => ['nullable', 'integer', 'exists:statut_offre,id_statut_offre'],
            'id_lieu' => ['required', 'integer', 'exists:lieu,id_lieu'],
            'titre_poste' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'date_publication' => ['nullable', 'date'],
            'date_limite' => ['nullable', 'date', 'after_or_equal:date_publication'],
            'profil' => ['nullable', 'array'],
            'profil.description' => ['nullable', 'string'],
            'profil.type_valeur' => ['nullable', 'string', 'max:50'],
            'profil.valeur_min' => ['nullable', 'numeric'],
            'profil.valeur_max' => ['nullable', 'numeric'],
            'profil.valeur_attendue' => ['nullable', 'string', 'max:100'],
            'profil.unite_valeur' => ['nullable', 'string', 'max:50'],
            'profils' => ['nullable', 'array'],
            'profils.*.description' => ['required_with:profils', 'string'],
            'profils.*.type_valeur' => ['nullable', 'string', 'max:50'],
            'profils.*.valeur_min' => ['nullable', 'numeric'],
            'profils.*.valeur_max' => ['nullable', 'numeric'],
            'profils.*.valeur_attendue' => ['nullable', 'string', 'max:100'],
            'profils.*.unite_valeur' => ['nullable', 'string', 'max:50'],
            'missions' => ['nullable', 'array'],
            'missions.*.description' => ['required_with:missions', 'string'],
            'missions.*.ordre' => ['nullable', 'integer', 'min:1'],
            'formations' => ['nullable', 'array'],
            'formations.*.domaine' => ['nullable', 'string', 'max:150'],
            'formations.*.id_niveau_min' => ['nullable', 'integer', 'exists:niveau,id_niveau'],
            'formations.*.id_niveau_max' => ['nullable', 'integer', 'exists:niveau,id_niveau'],
            'formations.*.niveau_min' => ['nullable', 'string', 'max:100'],
            'formations.*.niveau_max' => ['nullable', 'string', 'max:100'],
            'formations.*.obligatoire' => ['nullable', 'boolean'],
            'competences' => ['nullable', 'array'],
            'competences.*.id_competence' => ['required_with:competences', 'integer', 'exists:competence,id_competence'],
            'competences.*.niveau_requis' => ['nullable', 'string', 'max:50'],
        ];
    }
}

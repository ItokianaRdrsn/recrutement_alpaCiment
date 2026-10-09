<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Foundation\Http\FormRequest;

class ImportExternalCandidatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $donneesJson = $this->input('donnees_json');
        if (is_string($donneesJson)) {
            $donneesJson = json_decode($donneesJson, true);
        }

        if (is_array($donneesJson) && !empty($donneesJson['contact'])) {
            $contact = $donneesJson['contact'];
            $this->merge([
                'email' => $this->input('email') ?: ($contact['email'] ?? null),
                'nom_complet' => $this->input('nom_complet') ?: ($contact['nom_complet'] ?? null),
                'telephone' => $this->input('telephone') ?: ($contact['telephone'] ?? null),
                'ville' => $this->input('ville') ?: ($contact['ville'] ?? null),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'nom' => ['nullable', 'string', 'max:100'],
            'prenom' => ['nullable', 'string', 'max:100'],
            'nom_complet' => ['nullable', 'string', 'max:200'],
            'email' => ['required', 'email', 'max:150'],
            'telephone' => ['nullable', 'string', 'max:50'],
            'ville' => ['nullable', 'string', 'max:100'],
            'id_offre' => ['nullable', 'integer', 'exists:offre,id_offre'],
            'id_type_demande' => ['nullable', 'integer', 'exists:type_demande,id_type_demande'],
            'type_demande' => ['nullable', 'string', 'max:50'],
            'id_direction' => ['nullable', 'integer', 'exists:direction,id_direction'],
            'id_domaine' => ['nullable', 'integer', 'exists:domaine,id_domaine'],
            'poste_souhaite' => ['nullable', 'string', 'max:150'],
            'source' => ['nullable', 'string', 'max:100'],
            'message_motivation' => ['nullable', 'string'],
            'cv' => ['nullable', 'file', 'max:15360'],
            'cv_base64' => ['nullable', 'string'],
            'cv_nom' => ['nullable', 'string', 'max:255'],
            'cv_mime' => ['nullable', 'string', 'max:100'],
            'photo' => ['nullable', 'file', 'image', 'max:5120'],
            'texte_brut_ocr' => ['nullable', 'string'],
            'donnees_json' => ['nullable'],
            'sujet_email' => ['nullable', 'string', 'max:255'],
            'sujet' => ['nullable', 'string', 'max:255'],
            'corps_email' => ['nullable', 'string'],
            'contenu_email' => ['nullable', 'string'],
        ];
    }
}

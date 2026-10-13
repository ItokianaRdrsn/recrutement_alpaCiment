<?php

namespace App\Http\Requests\Candidature;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;

class ImportExternalCandidatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Extrait une adresse email propre depuis une chaîne brute ou un objet IMAP (ex: "Jean <jean@mail.com>")
     */
    protected function extractCleanEmail(mixed $raw): ?string
    {
        if (empty($raw)) {
            return null;
        }
        if (is_array($raw)) {
            $raw = $raw['value'][0]['address'] ?? $raw['address'] ?? $raw['text'] ?? json_encode($raw);
        }
        $str = trim((string) $raw);
        if (preg_match('/<([^>]+)>/', $str, $matches)) {
            $candidate = trim($matches[1]);
            if (filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
                return strtolower($candidate);
            }
        }
        if (preg_match('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $str, $matches)) {
            return strtolower($matches[0]);
        }
        return filter_var($str, FILTER_VALIDATE_EMAIL) ? strtolower($str) : null;
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

        // Support du payload structuré { candidat: { nom_complet, email, telephone, ville } }
        $candidatData = $this->input('candidat');
        if (is_array($candidatData)) {
            $this->merge([
                'email' => $this->input('email') ?: ($candidatData['email'] ?? null),
                'nom_complet' => $this->input('nom_complet') ?: ($candidatData['nom_complet'] ?? null),
                'telephone' => $this->input('telephone') ?: ($candidatData['telephone'] ?? null),
                'ville' => $this->input('ville') ?: ($candidatData['ville'] ?? null),
            ]);
        }

        // Nettoyage défensif de l'email (au cas où il contient "Nom <email@domaine.com>" ou vient de email_sender)
        $cleanEmail = $this->extractCleanEmail($this->input('email'))
            ?: $this->extractCleanEmail($this->input('email_sender'));
        if ($cleanEmail) {
            $this->merge(['email' => substr($cleanEmail, 0, 150)]);
        }

        // Nettoyage de id_offre (ignore "undefined", "null", 0, ou un id_offre inexistant en BDD)
        $rawIdOffre = $this->input('id_offre');
        if ($rawIdOffre === null || $rawIdOffre === '' || $rawIdOffre === 'undefined' || $rawIdOffre === 'null' || $rawIdOffre === 0 || $rawIdOffre === '0') {
            $this->merge(['id_offre' => null]);
        } elseif (is_numeric($rawIdOffre)) {
            $intOffre = (int) $rawIdOffre;
            $exists = \App\Models\Offre::where('id_offre', $intOffre)->exists();
            $this->merge(['id_offre' => $exists ? $intOffre : null]);
        } else {
            $this->merge(['id_offre' => null]);
        }

        // Support d'alias email_message_id ou message_id vers cle_idempotence
        $cle = $this->input('cle_idempotence')
            ?: $this->input('email_message_id')
            ?: $this->input('message_id');

        if (!empty($cle) && is_string($cle)) {
            $this->merge(['cle_idempotence' => substr(trim($cle), 0, 255)]);
        }

        // Support de email_subject et body
        if (!$this->has('sujet_email') && $this->has('email_subject') && is_string($this->input('email_subject'))) {
            $this->merge(['sujet_email' => mb_substr($this->input('email_subject'), 0, 250)]);
        }
        if ($this->has('sujet_email') && is_string($this->input('sujet_email'))) {
            $this->merge(['sujet_email' => mb_substr($this->input('sujet_email'), 0, 250)]);
        }

        // Tronquer défensivement les champs texte pour éviter toute erreur 422 validation.max.string
        if ($this->has('telephone') && is_string($this->input('telephone'))) {
            $this->merge(['telephone' => substr(trim($this->input('telephone')), 0, 50)]);
        }
        if ($this->has('ville') && is_string($this->input('ville'))) {
            $this->merge(['ville' => mb_substr(trim($this->input('ville')), 0, 100)]);
        }
        if ($this->has('nom_complet') && is_string($this->input('nom_complet'))) {
            $this->merge(['nom_complet' => mb_substr(trim($this->input('nom_complet')), 0, 200)]);
        }

        // Auto-remplissage de donnees_json si passé à la racine (competences, experiences, projets, formations)
        if (empty($donneesJson) && ($this->has('competences') || $this->has('experiences') || $this->has('projets') || $this->has('formations'))) {
            $this->merge([
                'donnees_json' => [
                    'contact' => is_array($candidatData) ? $candidatData : [
                        'nom_complet' => $this->input('nom_complet'),
                        'email' => $this->input('email'),
                        'telephone' => $this->input('telephone'),
                        'ville' => $this->input('ville'),
                    ],
                    'profil' => $this->input('profil'),
                    'competences' => $this->input('competences', []),
                    'experiences' => $this->input('experiences', []),
                    'projets' => $this->input('projets', []),
                    'formations' => $this->input('formations', []),
                ]
            ]);
        }

        // Extraction des temps d'exécution OCR / NER (depuis duree_secondes ou champs directs)
        $dureeSec = $this->input('duree_secondes');
        if (is_array($dureeSec)) {
            if (!$this->has('duree_ocr_s') && isset($dureeSec['ocr'])) {
                $this->merge(['duree_ocr_s' => (float) $dureeSec['ocr']]);
            }
            if (!$this->has('duree_ner_s') && isset($dureeSec['llm'])) {
                $this->merge(['duree_ner_s' => (float) $dureeSec['llm']]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'cle_idempotence' => ['nullable', 'string', 'max:255'],
            'email_message_id' => ['nullable'],
            'message_id' => ['nullable'],
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
            'candidat' => ['nullable', 'array'],
            'profil' => ['nullable', 'string'],
            'competences' => ['nullable', 'array'],
            'experiences' => ['nullable', 'array'],
            'projets' => ['nullable', 'array'],
            'formations' => ['nullable', 'array'],
            'code_offre' => ['nullable'],
            'email_subject' => ['nullable'],
            'email_sender' => ['nullable'],
            'date_reception' => ['nullable'],
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
            'message_motivation' => ['nullable', 'string'],
            'duree_classification_s' => ['nullable', 'numeric'],
            'duree_ocr_s' => ['nullable', 'numeric'],
            'duree_ner_s' => ['nullable', 'numeric'],
            'duree_totale_s' => ['nullable', 'numeric'],
            'duree_secondes' => ['nullable'],
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        Log::error('ImportExternalCandidature 422 Validation Failed', [
            'errors' => $validator->errors()->toArray(),
            'input_keys' => array_keys($this->all()),
            'email' => $this->input('email'),
            'id_offre' => $this->input('id_offre'),
        ]);

        parent::failedValidation($validator);
    }
}


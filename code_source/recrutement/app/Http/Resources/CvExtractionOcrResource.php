<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CvExtractionOcrResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_cv_extraction_ocr' => $this->id_cv_extraction_ocr,
            'id_candidature' => $this->id_candidature,
            'texte_brut_ocr' => $this->texte_brut_ocr,
            'donnees_json' => $this->donnees_json,
            'statut_validation' => $this->statut_validation,
            'commentaire_rh' => $this->commentaire_rh,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}

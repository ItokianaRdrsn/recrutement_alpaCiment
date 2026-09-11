<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StatutCandidatureResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_statut_candidature' => $this->id_statut_candidature,
            'libelle' => $this->libelle,
            'ordre_workflow' => $this->ordre_workflow,
        ];
    }
}

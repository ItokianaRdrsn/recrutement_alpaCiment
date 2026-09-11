<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VivierResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_vivier_candidat' => $this->resource['id_vivier_candidat'] ?? $this->id_vivier_candidat,
            'id_candidature' => $this->resource['id_candidature'] ?? $this->id_candidature ?? null,
            'id_candidat' => $this->resource['id_candidat'] ?? $this->id_candidat,
            'candidat' => $this->resource['candidat'] ?? $this->whenLoaded('candidat'),
            'direction' => $this->resource['direction'] ?? $this->whenLoaded('direction'),
            'domaine' => $this->resource['domaine'] ?? $this->whenLoaded('domaine'),
            'motif_ajout' => $this->resource['motif_ajout'] ?? $this->motif_ajout,
            'statut' => $this->resource['statut'] ?? $this->statut,
            'created_at' => $this->resource['created_at'] ?? $this->created_at,
        ];
    }
}

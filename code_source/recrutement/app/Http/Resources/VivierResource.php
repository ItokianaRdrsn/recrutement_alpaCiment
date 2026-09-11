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
        if (is_array($this->resource)) {
            return [
                'id_vivier_candidat' => $this->resource['id_vivier_candidat'] ?? null,
                'id_candidature' => $this->resource['id_candidature'] ?? null,
                'id_candidat' => $this->resource['id_candidat'] ?? null,
                'candidat' => $this->resource['candidat'] ?? null,
                'direction' => $this->resource['direction'] ?? null,
                'domaine' => $this->resource['domaine'] ?? null,
                'motif_ajout' => $this->resource['motif_ajout'] ?? null,
                'statut' => $this->resource['statut'] ?? null,
                'created_at' => $this->resource['created_at'] ?? null,
            ];
        }

        return [
            'id_vivier_candidat' => $this->id_vivier_candidat,
            'id_candidature' => $this->id_candidature ?? null,
            'id_candidat' => $this->id_candidat,
            'candidat' => $this->whenLoaded('candidat'),
            'direction' => $this->whenLoaded('direction'),
            'domaine' => $this->whenLoaded('domaine'),
            'motif_ajout' => $this->motif_ajout,
            'statut' => $this->statut,
            'created_at' => $this->created_at,
        ];
    }
}

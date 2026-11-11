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
                'poste_souhaite' => $this->resource['poste_souhaite'] ?? null,
                'motif_ajout' => $this->resource['motif_ajout'] ?? null,
                'statut' => $this->resource['statut'] ?? null,
                'created_at' => $this->resource['created_at'] ?? null,
                'cv_snippet' => $this->resource['cv_snippet'] ?? null,
            ];
        }

        return [
            'id_vivier_candidat' => $this->id_candidature,
            'id_candidature' => $this->id_candidature,
            'id_candidat' => $this->id_candidat,
            'candidat' => $this->whenLoaded('candidat'),
            'direction' => $this->whenLoaded('direction') ?? $this->offre?->direction ?? $this->domaine?->direction,
            'domaine' => $this->whenLoaded('domaine'),
            'offre' => $this->whenLoaded('offre'),
            'poste_souhaite' => $this->poste_souhaite ?? ($this->offre?->titre_poste ?? null),
            'motif_ajout' => $this->offre ? "Candidature sur l'offre : " . ($this->offre->titre_poste ?? 'Poste') : 'Candidature spontanée en vivier',
            'statut' => $this->statut?->libelle ?? 'Actif',
            'created_at' => $this->created_at,
            'cv_snippet' => $this->cv_snippet ?? null,
        ];
    }
}

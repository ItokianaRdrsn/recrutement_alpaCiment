<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CandidatureResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_candidature' => $this->id_candidature,
            'id_candidat' => $this->id_candidat,
            'id_offre' => $this->id_offre,
            'id_domaine' => $this->id_domaine,
            'id_type_demande' => $this->id_type_demande,
            'id_statut_candidature' => $this->id_statut_candidature,
            'dans_vivier' => (bool) $this->dans_vivier,
            'vue' => (bool) $this->vue,
            'poste_souhaite' => $this->poste_souhaite,
            'message' => $this->message,
            'canal_depot' => $this->canal_depot,
            'id_utilisateur_depot' => $this->id_utilisateur_depot,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'candidat' => $this->whenLoaded('candidat'),
            'offre' => $this->whenLoaded('offre'),
            'domaine' => $this->whenLoaded('domaine'),
            'type_demande' => $this->whenLoaded('typeDemande'),
            'typeDemande' => $this->whenLoaded('typeDemande'),
            'statut' => $this->whenLoaded('statut'),
            'documents' => $this->whenLoaded('documents'),
            'historique' => $this->whenLoaded('historique'),
        ];
    }
}

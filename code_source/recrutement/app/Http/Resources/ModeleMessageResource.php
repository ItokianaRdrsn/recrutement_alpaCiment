<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModeleMessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id_modele_message' => $this->id_modele_message,
            'id_type_message' => $this->id_type_message,
            'type_message' => $this->typeMessage ? [
                'id_type_message' => $this->typeMessage->id_type_message,
                'libelle' => $this->typeMessage->libelle,
            ] : null,
            'id_statut_candidature' => $this->id_statut_candidature,
            'statut_candidature' => $this->statutCandidature ? [
                'id_statut_candidature' => $this->statutCandidature->id_statut_candidature,
                'libelle' => $this->statutCandidature->libelle,
                'ordre_workflow' => $this->statutCandidature->ordre_workflow,
            ] : null,
            'nom_modele' => $this->nom_modele,
            'objet' => $this->objet,
            'contenu' => $this->contenu,
            'envoi_automatique' => (bool) $this->envoi_automatique,
            'actif' => (bool) $this->actif,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

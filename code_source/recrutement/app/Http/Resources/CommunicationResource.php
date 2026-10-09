<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommunicationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id_communication' => $this->id_communication,
            'id_candidature' => $this->id_candidature,
            'id_modele_message' => $this->id_modele_message,
            'modele_message' => $this->modeleMessage ? [
                'id_modele_message' => $this->modeleMessage->id_modele_message,
                'nom_modele' => $this->modeleMessage->nom_modele,
            ] : null,
            'id_type_message' => $this->id_type_message,
            'type_message' => $this->typeMessage ? [
                'id_type_message' => $this->typeMessage->id_type_message,
                'libelle' => $this->typeMessage->libelle,
            ] : null,
            'objet' => $this->objet,
            'contenu' => $this->contenu,
            'mode_envoi' => $this->mode_envoi,
            'date_envoi' => $this->date_envoi?->toISOString(),
            'id_utilisateur' => $this->id_utilisateur,
            'utilisateur' => $this->utilisateur ? [
                'id_utilisateur' => $this->utilisateur->id_utilisateur,
                'nom' => $this->utilisateur->nom,
                'email' => $this->utilisateur->email,
            ] : null,
        ];
    }
}

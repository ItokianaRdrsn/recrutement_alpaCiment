<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompetenceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_competence,
            'id_competence' => $this->id_competence,
            'nom' => $this->nom_competence,
            'nom_competence' => $this->nom_competence,
            'id_type_competence' => $this->id_type_competence,
            'type' => $this->type?->libelle,
        ];
    }
}

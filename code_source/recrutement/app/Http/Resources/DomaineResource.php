<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DomaineResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_domaine,
            'nom_domaine' => $this->nom_domaine,
            'valide' => $this->valide,
            'date_validation' => $this->date_validation?->toDateTimeString(),
            'direction' => $this->whenLoaded('direction', fn () => [
                'id' => $this->direction->id_direction,
                'nom' => $this->direction->nom_direction,
            ]),
            'validateur' => $this->whenLoaded('validateur', fn () => $this->validateur ? [
                'id' => $this->validateur->id,
                'name' => $this->validateur->name,
            ] : null),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DirectionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_direction,
            'nom_direction' => $this->nom_direction,
            'domaines_count' => $this->whenCounted('domaines'),
            'offres_count' => $this->whenCounted('offres'),
        ];
    }
}

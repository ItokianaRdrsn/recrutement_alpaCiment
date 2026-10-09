<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id_audit_log' => $this->id_audit_log,
            'action' => $this->action,
            'entite' => $this->entite,
            'id_entite' => $this->id_entite,
            'description' => $this->description,
            'anciennes_valeurs' => $this->anciennes_valeurs,
            'nouvelles_valeurs' => $this->nouvelles_valeurs,
            'ip_adresse' => $this->ip_adresse,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toISOString(),
            'utilisateur' => $this->utilisateur ? [
                'id_utilisateur' => $this->utilisateur->id_utilisateur,
                'nom' => $this->utilisateur->nom ?? $this->utilisateur->name,
                'email' => $this->utilisateur->email,
                'role' => $this->utilisateur->role,
            ] : null,
        ];
    }
}

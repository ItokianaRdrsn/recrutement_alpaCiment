<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OffreResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id_offre,
            'titre_poste' => $this->titre_poste,
            'description' => $this->description,
            'lieu' => $this->lieu,
            'date_publication' => $this->date_publication?->toDateString(),
            'date_limite' => $this->date_limite?->toDateString(),
            'direction' => $this->whenLoaded('direction', fn () => [
                'id' => $this->direction->id_direction,
                'nom' => $this->direction->nom_direction,
            ]),
            'statut' => $this->whenLoaded('statut', fn () => [
                'id' => $this->statut->id_statut_offre,
                'libelle' => $this->statut->libelle,
                'ordre_workflow' => $this->statut->ordre_workflow,
            ]),
            'type_contrat' => $this->whenLoaded('typeContrat', fn () => $this->typeContrat ? [
                'id' => $this->typeContrat->id_type_contrat,
                'libelle' => $this->typeContrat->libelle,
            ] : null),
            'profil' => $this->whenLoaded('profil', fn () => $this->profil ? [
                'description' => $this->profil->description,
                'type_valeur' => $this->profil->type_valeur,
                'valeur_min' => $this->profil->valeur_min,
                'valeur_max' => $this->profil->valeur_max,
                'valeur_attendue' => $this->profil->valeur_attendue,
                'unite_valeur' => $this->profil->unite_valeur,
            ] : null),
            'profils' => $this->whenLoaded('profils', fn () => $this->profils->map(fn ($p) => [
                'id' => $p->id_profil_offre,
                'description' => $p->description,
                'type_valeur' => $p->type_valeur,
                'valeur_min' => $p->valeur_min,
                'valeur_max' => $p->valeur_max,
                'valeur_attendue' => $p->valeur_attendue,
                'unite_valeur' => $p->unite_valeur,
            ])->values()),
            'missions' => $this->whenLoaded('missions', fn () => $this->missions->map(fn ($mission) => [
                'id' => $mission->id_mission,
                'description' => $mission->description,
                'ordre' => $mission->ordre,
            ])->values()),
            'formations' => $this->whenLoaded('formations', fn () => $this->formations->map(fn ($formation) => [
                'id' => $formation->id_profil_formation,
                'niveau_min' => $formation->niveau_min,
                'niveau_max' => $formation->niveau_max,
                'domaine' => $formation->domaine,
                'obligatoire' => $formation->obligatoire,
            ])->values()),
            'competences' => $this->whenLoaded('competences', fn () => $this->competences->map(fn ($competence) => [
                'id' => $competence->id_competence,
                'nom' => $competence->nom_competence,
                'type' => $competence->type?->libelle,
                'niveau_requis' => $competence->pivot->niveau_requis,
            ])->values()),
        ];
    }
}

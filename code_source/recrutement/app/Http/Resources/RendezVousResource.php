<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RendezVousResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $candidat = $this->candidature?->candidat;
        $offre = $this->candidature?->offre;

        return [
            'id_rendez_vous' => $this->id_rendez_vous,
            'id_candidature' => $this->id_candidature,
            'id_utilisateur' => $this->id_utilisateur,
            'id_type_rendez_vous' => $this->id_type_rendez_vous,
            'id_statut_rendez_vous' => $this->id_statut_rendez_vous,
            'id_mode_realisation' => $this->id_mode_realisation,
            'date_debut' => $this->date_debut?->toISOString(),
            'date_fin' => $this->date_fin?->toISOString(),
            'details_lieu' => $this->details_lieu,
            'commentaire' => $this->commentaire,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relations libellées
            'type_rendez_vous' => $this->typeRendezVous ? [
                'id_type_rendez_vous' => $this->typeRendezVous->id_type_rendez_vous,
                'libelle' => $this->typeRendezVous->libelle,
            ] : null,
            'statut_rendez_vous' => $this->statutRendezVous ? [
                'id_statut_rendez_vous' => $this->statutRendezVous->id_statut_rendez_vous,
                'libelle' => $this->statutRendezVous->libelle,
                'ordre_workflow' => $this->statutRendezVous->ordre_workflow,
            ] : null,
            'mode_realisation' => $this->modeRealisation ? [
                'id_mode_realisation' => $this->modeRealisation->id_mode_realisation,
                'libelle' => $this->modeRealisation->libelle,
            ] : null,
            'responsable' => $this->utilisateur ? [
                'id_utilisateur' => $this->utilisateur->id_utilisateur,
                'nom' => $this->utilisateur->nom ?? $this->utilisateur->name,
                'email' => $this->utilisateur->email,
                'role' => $this->utilisateur->role,
            ] : null,

            // Infos Candidat & Candidature pour l'agenda FullCalendar
            'candidat' => $candidat ? [
                'id_candidat' => $candidat->id_candidat,
                'nom' => $candidat->nom,
                'prenom' => $candidat->prenom,
                'email' => $candidat->email,
                'telephone' => $candidat->telephone,
            ] : null,
            'direction' => $this->candidature?->direction ? [
                'id_direction' => $this->candidature->direction->id_direction,
                'nom_direction' => $this->candidature->direction->nom_direction,
                'alias' => $this->candidature->direction->alias ?? null,
            ] : null,
            'offre' => $offre ? [
                'id_offre' => $offre->id_offre,
                'titre' => $offre->titre_poste ?? $offre->titre,
                'titre_poste' => $offre->titre_poste,
                'reference' => $offre->reference,
            ] : null,
            'poste_souhaite' => $this->candidature?->poste_souhaite,
        ];
    }
}

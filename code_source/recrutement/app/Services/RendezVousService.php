<?php

namespace App\Services;

use App\Enums\StatutRendezVousEnum;
use App\Models\RendezVous;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use App\Repositories\Contracts\RendezVousRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class RendezVousService
{
    public function __construct(
        protected RendezVousRepositoryInterface $rendezVousRepository,
        protected CandidatureRepositoryInterface $candidatureRepository,
        protected AuditLogService $auditLogService,
        protected CommunicationService $communicationService
    ) {}

    /**
     * Récupération des référentiels nécessaires à la planification via le repository.
     */
    public function getReferentiels(): array
    {
        return $this->rendezVousRepository->getReferentiels();
    }

    /**
     * Liste des rendez-vous avec filtres calendaires et critères RH via le repository.
     */
    public function getRendezVous(array $filters = [], bool $paginate = false, int $perPage = 50): Collection|LengthAwarePaginator
    {
        return $this->rendezVousRepository->getRendezVous($filters, $paginate, $perPage);
    }

    /**
     * Planifier un nouveau rendez-vous / entretien avec gestion d'historique et notifications.
     */
    public function planifier(array $data, ?int $idUtilisateurConnecte = null): RendezVous
    {
        if (empty($data['date_debut']) || empty($data['date_fin'])) {
            throw new InvalidArgumentException('Les dates de début et de fin sont obligatoires.');
        }

        $dateDebut = Carbon::parse($data['date_debut']);
        $dateFin = Carbon::parse($data['date_fin']);

        if ($dateFin->lte($dateDebut)) {
            throw new InvalidArgumentException('La date de fin doit être strictement supérieure à la date de début.');
        }

        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;

        return DB::transaction(function () use ($data, $dateDebut, $dateFin, $idUtilisateurConnecte) {
            $candidature = $this->candidatureRepository->findById((int) $data['id_candidature'], ['candidat']);

            $rendezVous = $this->rendezVousRepository->create([
                'id_candidature' => $candidature->id_candidature,
                'id_utilisateur' => $data['id_utilisateur'] ?? $idUtilisateurConnecte,
                'id_type_rendez_vous' => $data['id_type_rendez_vous'],
                'id_statut_rendez_vous' => $data['id_statut_rendez_vous'] ?? StatutRendezVousEnum::AVenir->value,
                'id_mode_realisation' => $data['id_mode_realisation'],
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'details_lieu' => $data['details_lieu'] ?? null,
                'commentaire' => $data['commentaire'] ?? null,
            ]);

            // Optionnel : mise à jour synchronisée du statut de la candidature
            if (!empty($data['id_statut_candidature_cible'])) {
                $nouveauStatut = $this->rendezVousRepository->findStatutCandidatureById((int) $data['id_statut_candidature_cible']);
                if ($nouveauStatut && (int) $candidature->id_statut_candidature !== (int) $nouveauStatut->id_statut_candidature) {
                    $ancienStatutId = (int) $candidature->id_statut_candidature;
                    $this->candidatureRepository->update($candidature, ['id_statut_candidature' => $nouveauStatut->id_statut_candidature]);

                    $this->rendezVousRepository->createHistoriqueStatut([
                        'id_candidature' => $candidature->id_candidature,
                        'id_statut_candidature' => $nouveauStatut->id_statut_candidature,
                        'commentaire' => 'Planification du rendez-vous #' . $rendezVous->id_rendez_vous,
                        'id_utilisateur' => $idUtilisateurConnecte,
                        'date_changement' => now(),
                    ]);

                    $this->auditLogService->log(
                        action: 'CHANGEMENT_STATUT_CANDIDAT',
                        entite: 'Candidature',
                        idEntite: $candidature->id_candidature,
                        description: "Statut changé vers {$nouveauStatut->libelle} lors de la planification du RDV #{$rendezVous->id_rendez_vous}",
                        anciennesValeurs: ['id_statut_candidature' => $ancienStatutId],
                        nouvellesValeurs: ['id_statut_candidature' => $nouveauStatut->id_statut_candidature],
                        idUtilisateur: $idUtilisateurConnecte
                    );
                }
            }

            // Audit log de création du rendez-vous
            $typeLibelle = $this->rendezVousRepository->findTypeById((int) $rendezVous->id_type_rendez_vous)?->libelle ?? 'Rendez-vous';
            $nomCandidat = $candidature->candidat ? "{$candidature->candidat->prenom} {$candidature->candidat->nom}" : "Candidature #{$candidature->id_candidature}";

            $this->auditLogService->log(
                action: 'PLANIFICATION_RDV',
                entite: 'RendezVous',
                idEntite: $rendezVous->id_rendez_vous,
                description: "Planification {$typeLibelle} pour {$nomCandidat} le {$dateDebut->format('d/m/Y H:i')}",
                anciennesValeurs: null,
                nouvellesValeurs: $rendezVous->toArray(),
                idUtilisateur: $idUtilisateurConnecte
            );

            // Notification par e-mail au candidat (si demandée, défaut true)
            if (!isset($data['envoyer_notification_email']) || filter_var($data['envoyer_notification_email'], FILTER_VALIDATE_BOOLEAN)) {
                try {
                    $this->communicationService->envoyerConvocation($rendezVous, null, $idUtilisateurConnecte);
                } catch (\Throwable $e) {
                    Log::warning("Erreur notification email convocation RDV #{$rendezVous->id_rendez_vous}: " . $e->getMessage());
                }
            }

            return $rendezVous->load([
                'candidature.candidat',
                'candidature.offre',
                'utilisateur',
                'typeRendezVous',
                'statutRendezVous',
                'modeRealisation',
            ]);
        });
    }

    /**
     * Mettre à jour un rendez-vous (reprogrammation, modification des détails ou statut).
     */
    public function modifier(RendezVous $rendezVous, array $data, ?int $idUtilisateurConnecte = null): RendezVous
    {
        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;

        $debut = isset($data['date_debut']) ? Carbon::parse($data['date_debut']) : $rendezVous->date_debut;
        $fin = isset($data['date_fin']) ? Carbon::parse($data['date_fin']) : $rendezVous->date_fin;

        if ($debut && $fin && $fin->lte($debut)) {
            throw new InvalidArgumentException('La date de fin doit être strictement supérieure à la date de début.');
        }

        if (isset($data['date_debut'])) {
            $data['date_debut'] = $debut;
        }
        if (isset($data['date_fin'])) {
            $data['date_fin'] = $fin;
        }

        // Extraire et nettoyer les données hors modèle RendezVous
        $idStatutCandidatureCible = $data['id_statut_candidature_cible'] ?? null;
        unset($data['id_statut_candidature_cible']);

        $envoyerNotificationEmail = $data['envoyer_notification_email'] ?? false;
        unset($data['envoyer_notification_email']);

        $anciennesValeurs = $rendezVous->toArray();
        $this->rendezVousRepository->update($rendezVous, $data);

        // Optionnel : synchronisation du statut de la candidature
        if ($idStatutCandidatureCible && $rendezVous->candidature) {
            $nouveauStatut = $this->rendezVousRepository->findStatutCandidatureById((int) $idStatutCandidatureCible);
            if ($nouveauStatut && (int) $rendezVous->candidature->id_statut_candidature !== (int) $nouveauStatut->id_statut_candidature) {
                $candidature = $rendezVous->candidature;
                $ancienStatutId = (int) $candidature->id_statut_candidature;
                $this->candidatureRepository->update($candidature, ['id_statut_candidature' => $nouveauStatut->id_statut_candidature]);

                $this->rendezVousRepository->createHistoriqueStatut([
                    'id_candidature' => $candidature->id_candidature,
                    'id_statut_candidature' => $nouveauStatut->id_statut_candidature,
                    'commentaire' => 'Mise à jour suite modification du RDV #' . $rendezVous->id_rendez_vous,
                    'id_utilisateur' => $idUtilisateurConnecte,
                    'date_changement' => now(),
                ]);

                $this->auditLogService->log(
                    action: 'CHANGEMENT_STATUT_CANDIDAT',
                    entite: 'Candidature',
                    idEntite: $candidature->id_candidature,
                    description: "Statut changé vers {$nouveauStatut->libelle} lors de la modification du RDV #{$rendezVous->id_rendez_vous}",
                    anciennesValeurs: ['id_statut_candidature' => $ancienStatutId],
                    nouvellesValeurs: ['id_statut_candidature' => $nouveauStatut->id_statut_candidature],
                    idUtilisateur: $idUtilisateurConnecte
                );
            }
        }

        // Notification email si demandée explicitement
        if ($envoyerNotificationEmail) {
            try {
                $this->communicationService->envoyerConvocation($rendezVous, null, $idUtilisateurConnecte);
            } catch (\Throwable $e) {
                Log::warning("Erreur renvoi email RDV #{$rendezVous->id_rendez_vous}: " . $e->getMessage());
            }
        }

        $fresh = $rendezVous->fresh();
        $this->auditLogService->log(
            action: 'MODIFICATION_RDV',
            entite: 'RendezVous',
            idEntite: $rendezVous->id_rendez_vous,
            description: "Modification du rendez-vous #{$rendezVous->id_rendez_vous}",
            anciennesValeurs: $anciennesValeurs,
            nouvellesValeurs: $fresh ? $fresh->toArray() : [],
            idUtilisateur: $idUtilisateurConnecte
        );

        return $fresh;
    }

    /**
     * Annuler un rendez-vous (changement de statut vers 'Annulé').
     */
    public function annuler(RendezVous $rendezVous, ?string $motif = null, ?int $idUtilisateurConnecte = null): RendezVous
    {
        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;

        $anciennesValeurs = $rendezVous->toArray();

        $this->rendezVousRepository->update($rendezVous, [
            'id_statut_rendez_vous' => StatutRendezVousEnum::Annule->value,
            'commentaire' => $motif ? ($rendezVous->commentaire ? $rendezVous->commentaire . "\nMotif annulation : " . $motif : 'Motif annulation : ' . $motif) : $rendezVous->commentaire,
        ]);

        $this->auditLogService->log(
            action: 'ANNULATION_RDV',
            entite: 'RendezVous',
            idEntite: $rendezVous->id_rendez_vous,
            description: "Annulation du rendez-vous #{$rendezVous->id_rendez_vous}" . ($motif ? " (Motif: {$motif})" : ''),
            anciennesValeurs: $anciennesValeurs,
            nouvellesValeurs: $rendezVous->fresh()->toArray(),
            idUtilisateur: $idUtilisateurConnecte
        );

        return $rendezVous->fresh([
            'candidature.candidat',
            'utilisateur',
            'typeRendezVous',
            'statutRendezVous',
            'modeRealisation',
        ]);
    }

    /**
     * Supprimer définitivement un rendez-vous.
     */
    public function supprimer(RendezVous $rendezVous, ?int $idUtilisateurConnecte = null): bool
    {
        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;

        $anciennesValeurs = $rendezVous->toArray();
        $idRdv = $rendezVous->id_rendez_vous;

        $deleted = $this->rendezVousRepository->delete($rendezVous);

        if ($deleted) {
            $this->auditLogService->log(
                action: 'SUPPRESSION_RDV',
                entite: 'RendezVous',
                idEntite: $idRdv,
                description: "Suppression définitive du rendez-vous #{$idRdv}",
                anciennesValeurs: $anciennesValeurs,
                nouvellesValeurs: null,
                idUtilisateur: $idUtilisateurConnecte
            );
        }

        return $deleted;
    }
}

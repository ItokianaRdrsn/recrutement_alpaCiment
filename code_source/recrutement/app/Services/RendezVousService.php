<?php

namespace App\Services;

use App\Models\Candidature;
use App\Models\HistoriqueStatut;
use App\Models\ModeRealisation;
use App\Models\RendezVous;
use App\Models\StatutCandidature;
use App\Models\StatutRendezVous;
use App\Models\TypeRendezVous;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RendezVousService
{
    public function __construct(
        protected ?AuditLogService $auditLogService = null,
        protected ?CommunicationService $communicationService = null
    ) {
        $this->auditLogService = $auditLogService ?? app(AuditLogService::class);
        $this->communicationService = $communicationService ?? app(CommunicationService::class);
    }

    /**
     * Récupération des référentiels nécessaires à la planification.
     */
    public function getReferentiels(): array
    {
        return [
            'types' => TypeRendezVous::all(),
            'statuts' => StatutRendezVous::orderBy('ordre_workflow')->get(),
            'modes' => ModeRealisation::all(),
            'responsables' => User::whereIn('role', ['rh', 'admin', 'manager'])
                ->select(['id_utilisateur', 'nom', 'email', 'role'])
                ->get(),
        ];
    }

    /**
     * Liste des rendez-vous avec filtres calendaires et critères RH.
     */
    public function getRendezVous(array $filters = [], bool $paginate = false, int $perPage = 50): Collection|LengthAwarePaginator
    {
        $query = RendezVous::with([
            'candidature.candidat',
            'candidature.offre.direction',
            'candidature.domaine.direction',
            'utilisateur',
            'typeRendezVous',
            'statutRendezVous',
            'modeRealisation',
        ]);

        if (!empty($filters['date_debut'])) {
            $query->where('date_fin', '>=', Carbon::parse($filters['date_debut']));
        }

        if (!empty($filters['date_fin'])) {
            $query->where('date_debut', '<=', Carbon::parse($filters['date_fin']));
        }

        if (!empty($filters['id_candidature'])) {
            $query->where('id_candidature', $filters['id_candidature']);
        }

        if (!empty($filters['id_utilisateur'])) {
            $query->where('id_utilisateur', $filters['id_utilisateur']);
        }

        if (!empty($filters['id_type_rendez_vous'])) {
            $query->where('id_type_rendez_vous', $filters['id_type_rendez_vous']);
        }

        if (!empty($filters['id_statut_rendez_vous'])) {
            $query->where('id_statut_rendez_vous', $filters['id_statut_rendez_vous']);
        }

        if (!empty($filters['id_mode_realisation'])) {
            $query->where('id_mode_realisation', $filters['id_mode_realisation']);
        }

        $query->orderBy('date_debut', 'asc');

        return $paginate ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Planifier un nouveau rendez-vous (Test ou Entretien).
     */
    public function planifier(array $data, ?int $idUtilisateurConnecte = null): RendezVous
    {
        $dateDebut = Carbon::parse($data['date_debut']);
        $dateFin = Carbon::parse($data['date_fin']);

        if ($dateFin->lte($dateDebut)) {
            throw new InvalidArgumentException('La date de fin doit être strictement supérieure à la date de début.');
        }

        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;

        return DB::transaction(function () use ($data, $dateDebut, $dateFin, $idUtilisateurConnecte) {
            $candidature = Candidature::with('candidat')->findOrFail($data['id_candidature']);

            $rendezVous = RendezVous::create([
                'id_candidature' => $candidature->id_candidature,
                'id_utilisateur' => $data['id_utilisateur'] ?? $idUtilisateurConnecte,
                'id_type_rendez_vous' => $data['id_type_rendez_vous'],
                'id_statut_rendez_vous' => $data['id_statut_rendez_vous'] ?? 1, // 1 = A venir
                'id_mode_realisation' => $data['id_mode_realisation'],
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'details_lieu' => $data['details_lieu'] ?? null,
                'commentaire' => $data['commentaire'] ?? null,
            ]);

            // Optionnel : mise à jour synchronisée du statut de la candidature
            if (!empty($data['id_statut_candidature_cible'])) {
                $nouveauStatut = StatutCandidature::find($data['id_statut_candidature_cible']);
                if ($nouveauStatut && $candidature->id_statut_candidature !== $nouveauStatut->id_statut_candidature) {
                    $ancienStatutId = $candidature->id_statut_candidature;
                    $candidature->update(['id_statut_candidature' => $nouveauStatut->id_statut_candidature]);

                    HistoriqueStatut::create([
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
            $typeLibelle = TypeRendezVous::find($rendezVous->id_type_rendez_vous)?->libelle ?? 'Rendez-vous';
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
                    \Illuminate\Support\Facades\Log::warning("Erreur notification email convocation RDV #{$rendezVous->id_rendez_vous}: " . $e->getMessage());
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

        if (!empty($data['date_debut']) && !empty($data['date_fin'])) {
            $dateDebut = Carbon::parse($data['date_debut']);
            $dateFin = Carbon::parse($data['date_fin']);

            if ($dateFin->lte($dateDebut)) {
                throw new InvalidArgumentException('La date de fin doit être strictement supérieure à la date de début.');
            }
            $data['date_debut'] = $dateDebut;
            $data['date_fin'] = $dateFin;
        }

        $anciennesValeurs = $rendezVous->toArray();
        $rendezVous->update($data);

        $this->auditLogService->log(
            action: 'MODIFICATION_RDV',
            entite: 'RendezVous',
            idEntite: $rendezVous->id_rendez_vous,
            description: "Modification du rendez-vous #{$rendezVous->id_rendez_vous}",
            anciennesValeurs: $anciennesValeurs,
            nouvellesValeurs: $rendezVous->fresh()->toArray(),
            idUtilisateur: $idUtilisateurConnecte
        );

        return $rendezVous->fresh()->load([
            'candidature.candidat',
            'candidature.offre',
            'utilisateur',
            'typeRendezVous',
            'statutRendezVous',
            'modeRealisation',
        ]);
    }

    /**
     * Supprimer ou marquer comme annulé un rendez-vous.
     */
    public function annuler(RendezVous $rendezVous, ?string $motif = null, ?int $idUtilisateurConnecte = null): RendezVous
    {
        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;
        $anciennesValeurs = $rendezVous->toArray();

        // Statut 3 = Annulé
        $rendezVous->update([
            'id_statut_rendez_vous' => 3,
            'commentaire' => $motif ? trim(($rendezVous->commentaire ?? '') . " [Annulé: $motif]") : $rendezVous->commentaire,
        ]);

        $this->auditLogService->log(
            action: 'ANNULATION_RDV',
            entite: 'RendezVous',
            idEntite: $rendezVous->id_rendez_vous,
            description: "Annulation du rendez-vous #{$rendezVous->id_rendez_vous}" . ($motif ? " ($motif)" : ''),
            anciennesValeurs: $anciennesValeurs,
            nouvellesValeurs: $rendezVous->fresh()->toArray(),
            idUtilisateur: $idUtilisateurConnecte
        );

        return $rendezVous->fresh()->load([
            'candidature.candidat',
            'candidature.offre',
            'utilisateur',
            'typeRendezVous',
            'statutRendezVous',
            'modeRealisation',
        ]);
    }

    /**
     * Suppression définitive.
     */
    public function supprimer(RendezVous $rendezVous, ?int $idUtilisateurConnecte = null): bool
    {
        $idUtilisateurConnecte = $idUtilisateurConnecte ?? Auth::id() ?? 1;
        $anciennesValeurs = $rendezVous->toArray();
        $idRdv = $rendezVous->id_rendez_vous;

        $deleted = $rendezVous->delete();

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

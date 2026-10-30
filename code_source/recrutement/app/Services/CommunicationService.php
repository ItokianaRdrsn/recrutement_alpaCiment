<?php

namespace App\Services;

use App\Enums\ModeEnvoiCommunication;
use App\Mail\CandidatureCommunicationMail;
use App\Models\AuditLog;
use App\Models\Candidature;
use App\Models\Communication;
use App\Models\ModeleMessage;
use App\Models\RendezVous;
use App\Models\TypeMessage;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use App\Repositories\Contracts\CommunicationRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;

class CommunicationService
{
    public function __construct(
        protected CommunicationRepositoryInterface $communicationRepository,
        protected CandidatureRepositoryInterface $candidatureRepository,
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Moteur de remplacement des variables dans un template.
     * Supporte à la fois {cle} et {{cle}}.
     */
    public function remplacerVariables(string $texte, Candidature $candidature, ?RendezVous $rdv = null, array $extraVariables = []): string
    {
        $candidat = $candidature->candidat;
        $offre = $candidature->offre;
        $domaine = $candidature->domaine;

        $poste = $extraVariables['poste']
            ?? $offre?->titre_poste 
            ?? $offre?->titre 
            ?? $candidature->poste_souhaite 
            ?? 'Poste chez AlpA Ciment';

        $direction = $extraVariables['direction']
            ?? $offre?->direction?->nom_direction 
            ?? $domaine?->direction?->nom_direction 
            ?? 'Ressources Humaines';

        $dateRdv = $extraVariables['date_rdv'] ?? '';
        $heureRdv = $extraVariables['heure_rdv'] ?? '';
        $modeRdv = $extraVariables['mode_rdv'] ?? '';
        $lieuRdv = $extraVariables['lieu_rdv'] ?? '';
        $responsable = $extraVariables['responsable'] ?? '';

        if (!$rdv && $candidature->exists) {
            try {
                $rdv = $candidature->rendezVous()->with(['modeRealisation', 'utilisateur'])->latest('date_debut')->first();
            } catch (\Throwable) {
                $rdv = null;
            }
        }

        if ($rdv) {
            $dateDebut = Carbon::parse($rdv->date_debut);
            $dateFin = Carbon::parse($rdv->date_fin);
            if (empty($dateRdv)) {
                $dateRdv = $dateDebut->locale('fr')->isoFormat('dddd D MMMM YYYY');
            }
            if (empty($heureRdv)) {
                $heureRdv = $dateDebut->format('H:i') . ' à ' . $dateFin->format('H:i');
            }
            if (empty($modeRdv)) {
                $modeRdv = $rdv->modeRealisation?->libelle ?? 'Présentiel';
            }
            if (empty($lieuRdv)) {
                $lieuRdv = $rdv->details_lieu ?? ($modeRdv === 'Visioconference' ? 'Lien communiqué ultérieurement' : 'Siège AlpA Ciment');
            }
            if (empty($responsable) && $rdv->utilisateur) {
                $responsable = $rdv->utilisateur->nom;
            }
        }

        $variables = [
            'nom' => $candidat?->nom ?? '',
            'prenom' => $candidat?->prenom ?? '',
            'nom_complet' => trim(($candidat?->prenom ?? '') . ' ' . ($candidat?->nom ?? '')),
            'email' => $candidat?->email ?? '',
            'telephone' => $candidat?->telephone ?? '',
            'poste' => $poste,
            'direction' => $direction,
            'date_rdv' => $dateRdv,
            'heure_rdv' => $heureRdv,
            'mode_rdv' => $modeRdv,
            'lieu_rdv' => $lieuRdv,
            'responsable' => $responsable,
            'nom_responsable' => $responsable,
            'date_jour' => now()->locale('fr')->isoFormat('D MMMM YYYY'),
        ];

        // Fusion des variables supplémentaires éventuelles
        foreach ($extraVariables as $cle => $valeur) {
            if (!empty($valeur) && is_scalar($valeur)) {
                $variables[$cle] = (string) $valeur;
            }
        }

        $resultat = $texte;
        foreach ($variables as $cle => $valeur) {
            // Remplacement {cle} et {{cle}} (insensible à la casse)
            $resultat = preg_replace('/\{\{\s*' . preg_quote($cle, '/') . '\s*\}\}/i', (string) $valeur, $resultat);
            $resultat = preg_replace('/\{\s*' . preg_quote($cle, '/') . '\s*\}/i', (string) $valeur, $resultat);
        }

        return $resultat;
    }

    /**
     * Envoie un message et enregistre l'historique dans la table `communication`.
     */
    public function envoyerMessage(int $idCandidature, array $data, ?int $idUtilisateur = null): Communication
    {
        $candidature = $this->candidatureRepository->findById($idCandidature, ['candidat', 'offre.direction', 'domaine.direction']);

        if (!$candidature->candidat?->email) {
            throw new InvalidArgumentException("Le candidat n'a pas d'adresse e-mail valide enregistrée.");
        }

        $idModele = $data['id_modele_message'] ?? null;
        $modele = $idModele ? $this->communicationRepository->findModeleById($idModele) : null;

        $idTypeMessage = $data['id_type_message'] 
            ?? $modele?->id_type_message 
            ?? 6; // 6 = Autre par défaut

        $modeEnvoi = $data['mode_envoi'] ?? ModeEnvoiCommunication::Manuel->value;
        $sujetBrut = $data['objet'] ?? $modele?->objet ?? 'Communication AlpA Ciment';
        $contenuBrut = $data['contenu'] ?? $modele?->contenu ?? '';

        $extraVars = $data['variables'] ?? [];

        // Substitution des variables dans le sujet et le contenu (candidature, rdv, extraVars)
        $sujet = $this->remplacerVariables($sujetBrut, $candidature, null, $extraVars);
        $contenu = $this->remplacerVariables($contenuBrut, $candidature, null, $extraVars);

        return DB::transaction(function () use ($candidature, $idModele, $idTypeMessage, $sujet, $contenu, $modeEnvoi, $idUtilisateur) {
            // 1. Enregistrement en base de la communication via repository
            $communication = $this->communicationRepository->create([
                'id_candidature' => $candidature->id_candidature,
                'id_modele_message' => $idModele,
                'id_type_message' => $idTypeMessage,
                'objet' => $sujet,
                'contenu' => $contenu,
                'mode_envoi' => $modeEnvoi,
                'date_envoi' => now(),
                'id_utilisateur' => $idUtilisateur,
            ]);

            // 2. Envoi effectif de l'email via Laravel Mail
            try {
                $recipientEmail = $candidature->candidat->email;
                $recipientName = trim(($candidature->candidat->prenom ?? '') . ' ' . ($candidature->candidat->nom ?? ''));
                
                Mail::to($recipientEmail, $recipientName ?: null)
                    ->send(new CandidatureCommunicationMail($sujet, $contenu, $recipientName));
            } catch (\Throwable $e) {
                Log::error("Erreur envoi email candidature #{$candidature->id_candidature}: " . $e->getMessage(), [
                    'exception' => $e,
                ]);
                // On n'échoue pas la transaction si le mailer échoue en local, mais on logge
            }

            // 3. Traçabilité dans audit_log
            $this->auditLogService->log(
                action: 'ENVOI_COMMUNICATION',
                entite: 'Communication',
                idEntite: $communication->id_communication,
                description: "Email '{$sujet}' envoyé à {$candidature->candidat->email} (mode: {$modeEnvoi})",
                anciennesValeurs: null,
                nouvellesValeurs: [
                    'id_candidature' => $candidature->id_candidature,
                    'objet' => $sujet,
                    'mode_envoi' => $modeEnvoi,
                ],
                idUtilisateur: $idUtilisateur
            );

            return $communication;
        });
    }

    /**
     * Envoie la convocation automatique liée à un rendez-vous RH.
     */
    public function envoyerConvocation(RendezVous $rdv, ?int $idModele = null, ?int $idUtilisateur = null): ?Communication
    {
        $rdv->loadMissing(['candidature.candidat', 'candidature.offre.direction', 'candidature.domaine.direction', 'modeRealisation', 'typeRendezVous']);
        $candidature = $rdv->candidature;

        if (!$candidature || !$candidature->candidat?->email) {
            return null;
        }

        // Trouver le modèle approprié si non précisé via repository
        if (!$idModele) {
            $isEntretien = (int) $rdv->id_type_rendez_vous === 2;
            $statutCible = $isEntretien ? 4 : 3; // 4 = Entretien, 3 = Test
            $modele = $this->communicationRepository->findModeleConvocation($statutCible);
        } else {
            $modele = $this->communicationRepository->findModeleById($idModele);
        }

        if (!$modele) {
            // Modèle par défaut générique si aucun en base
            $sujetBrut = 'AlpA Ciment - Convocation à votre rendez-vous';
            $contenuBrut = "Bonjour {prenom} {nom},\n\nNous vous confirmons votre rendez-vous le {date_rdv} à {heure_rdv} ({mode_rdv}).\nLieu / Modalités : {lieu_rdv}\n\nCordialement,\nAlpA Ciment";
        } else {
            $sujetBrut = $modele->objet;
            $contenuBrut = $modele->contenu;
        }

        $sujet = $this->remplacerVariables($sujetBrut, $candidature, $rdv);
        $contenu = $this->remplacerVariables($contenuBrut, $candidature, $rdv);

        return $this->envoyerMessage($candidature->id_candidature, [
            'id_modele_message' => $modele?->id_modele_message,
            'id_type_message' => 2, // 2 = Convocation
            'objet' => $sujet,
            'contenu' => $contenu,
            'mode_envoi' => ModeEnvoiCommunication::Auto->value,
        ], $idUtilisateur);
    }

    /**
     * Envoie l'accusé de réception automatique après dépôt d'une candidature.
     */
    public function envoyerAccuseReception(Candidature $candidature): ?Communication
    {
        $candidature->loadMissing(['candidat', 'offre.direction', 'domaine.direction']);

        if (!$candidature->candidat?->email) {
            return null;
        }

        $modele = $this->communicationRepository->findModeleAccuseReception();

        if (!$modele) {
            return null;
        }

        $sujet = $this->remplacerVariables($modele->objet, $candidature);
        $contenu = $this->remplacerVariables($modele->contenu, $candidature);

        return $this->envoyerMessage($candidature->id_candidature, [
            'id_modele_message' => $modele->id_modele_message,
            'id_type_message' => $modele->id_type_message,
            'objet' => $sujet,
            'contenu' => $contenu,
            'mode_envoi' => ModeEnvoiCommunication::Auto->value,
        ], null);
    }
}

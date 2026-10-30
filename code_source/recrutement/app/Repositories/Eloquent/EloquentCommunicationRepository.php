<?php

namespace App\Repositories\Eloquent;

use App\Models\Communication;
use App\Models\ModeleMessage;
use App\Repositories\Contracts\CommunicationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentCommunicationRepository implements CommunicationRepositoryInterface
{
    public function create(array $attributes): Communication
    {
        return Communication::create($attributes);
    }

    public function findModeleById(int $id): ?ModeleMessage
    {
        return ModeleMessage::find($id);
    }

    public function findModeleByTypeMessage(int $idTypeMessage): ?ModeleMessage
    {
        return ModeleMessage::where('id_type_message', $idTypeMessage)
            ->where('actif', true)
            ->first();
    }

    public function findModeleConvocation(?int $statutCible = null): ?ModeleMessage
    {
        if ($statutCible) {
            $modele = ModeleMessage::where('id_type_message', 2)
                ->where('id_statut_candidature', $statutCible)
                ->where('actif', true)
                ->first();
            if ($modele) {
                return $modele;
            }
        }

        return ModeleMessage::where('id_type_message', 2)
            ->where('actif', true)
            ->first();
    }

    public function findModeleAccuseReception(): ?ModeleMessage
    {
        return ModeleMessage::where('envoi_automatique', true)
            ->where('id_statut_candidature', 1)
            ->where('actif', true)
            ->first();
    }

    public function getByCandidature(int $idCandidature): Collection
    {
        return Communication::where('id_candidature', $idCandidature)
            ->with(['typeMessage', 'modeleMessage', 'utilisateur'])
            ->orderByDesc('date_envoi')
            ->get();
    }
}

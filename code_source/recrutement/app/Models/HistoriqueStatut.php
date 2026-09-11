<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueStatut extends Model
{
    use HasFactory;

    protected $table = 'historique_statut';
    protected $primaryKey = 'id_historique';

    protected $fillable = [
        'id_candidature',
        'id_statut_candidature',
        'date_changement',
        'commentaire',
        'id_utilisateur',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'date_changement' => 'datetime',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }

    public function statut(): BelongsTo
    {
        return $this->belongsTo(StatutCandidature::class, 'id_statut_candidature', 'id_statut_candidature');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
}

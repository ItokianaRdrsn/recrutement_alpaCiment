<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoriqueStatut extends Model
{
    use HasFactory;

    protected $table = 'historique_statut';
    protected $primaryKey = 'id_historique_statut';
    public $timestamps = false;

    protected $fillable = [
        'id_candidature',
        'id_statut_precedent',
        'id_statut_nouveau',
        'modifie_par',
        'commentaire',
        'created_at',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }

    public function statutPrecedent(): BelongsTo
    {
        return $this->belongsTo(StatutCandidature::class, 'id_statut_precedent', 'id_statut_candidature');
    }

    public function statutNouveau(): BelongsTo
    {
        return $this->belongsTo(StatutCandidature::class, 'id_statut_nouveau', 'id_statut_candidature');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modifie_par');
    }
}

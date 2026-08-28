<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidature extends Model
{
    use HasFactory;

    protected $table = 'candidatures';
    protected $primaryKey = 'id_candidature';

    protected $fillable = [
        'id_candidat',
        'id_type_demande',
        'id_offre',
        'id_direction',
        'id_domaine',
        'id_statut_candidature',
        'date_candidature',
        'message_motivation',
        'postule_depuis',
        'id_recruteur_assigne',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'id_candidat', 'id_candidat');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'id_direction', 'id_direction');
    }

    public function domaine(): BelongsTo
    {
        return $this->belongsTo(Domaine::class, 'id_domaine', 'id_domaine');
    }

    public function statut(): BelongsTo
    {
        return $this->belongsTo(StatutCandidature::class, 'id_statut_candidature', 'id_statut_candidature');
    }

    public function recruteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_recruteur_assigne');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class, 'id_candidature', 'id_candidature');
    }

    public function historique(): HasMany
    {
        return $this->hasMany(HistoriqueStatut::class, 'id_candidature', 'id_candidature')->orderBy('created_at', 'desc');
    }
}

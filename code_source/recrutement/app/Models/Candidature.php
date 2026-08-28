<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidature extends Model
{
    use HasFactory;

    protected $table = 'candidature';
    protected $primaryKey = 'id_candidature';

    public $timestamps = false;

    protected $fillable = [
        'id_candidat',
        'id_type_demande',
        'id_offre',
        'id_domaine',
        'id_statut_candidature',
        'dans_vivier',
        'poste_souhaite',
        'message',
        'canal_depot',
        'id_utilisateur_depot',
        'date_candidature',
        'date_maj',
    ];

    protected $casts = [
        'dans_vivier' => 'boolean',
        'date_candidature' => 'datetime',
        'date_maj' => 'datetime',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'id_candidat', 'id_candidat');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }

    public function domaine(): BelongsTo
    {
        return $this->belongsTo(Domaine::class, 'id_domaine', 'id_domaine');
    }

    public function typeDemande(): BelongsTo
    {
        return $this->belongsTo(TypeDemande::class, 'id_type_demande', 'id_type_demande');
    }

    public function direction()
    {
        if ($this->offre && $this->offre->direction) {
            return $this->offre->direction();
        }
        if ($this->domaine && $this->domaine->direction) {
            return $this->domaine->direction();
        }
        return $this->belongsTo(Direction::class, 'id_direction', 'id_direction');
    }

    public function getMessageMotivationAttribute()
    {
        return $this->message;
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

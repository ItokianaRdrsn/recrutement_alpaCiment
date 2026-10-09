<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RendezVous extends Model
{
    use HasFactory;

    protected $table = 'rendez_vous';
    protected $primaryKey = 'id_rendez_vous';

    protected $fillable = [
        'id_candidature',
        'id_utilisateur',
        'id_type_rendez_vous',
        'id_statut_rendez_vous',
        'id_mode_realisation',
        'date_debut',
        'date_fin',
        'details_lieu',
        'commentaire',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }

    public function typeRendezVous(): BelongsTo
    {
        return $this->belongsTo(TypeRendezVous::class, 'id_type_rendez_vous', 'id_type_rendez_vous');
    }

    public function statutRendezVous(): BelongsTo
    {
        return $this->belongsTo(StatutRendezVous::class, 'id_statut_rendez_vous', 'id_statut_rendez_vous');
    }

    public function modeRealisation(): BelongsTo
    {
        return $this->belongsTo(ModeRealisation::class, 'id_mode_realisation', 'id_mode_realisation');
    }
}

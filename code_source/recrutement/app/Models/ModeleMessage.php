<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ModeleMessage extends Model
{
    use HasFactory;

    protected $table = 'modele_message';
    protected $primaryKey = 'id_modele_message';

    protected $fillable = [
        'id_type_message',
        'id_statut_candidature',
        'nom_modele',
        'objet',
        'contenu',
        'envoi_automatique',
        'actif',
    ];

    protected $casts = [
        'envoi_automatique' => 'boolean',
        'actif' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function typeMessage(): BelongsTo
    {
        return $this->belongsTo(TypeMessage::class, 'id_type_message', 'id_type_message');
    }

    public function statutCandidature(): BelongsTo
    {
        return $this->belongsTo(StatutCandidature::class, 'id_statut_candidature', 'id_statut_candidature');
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class, 'id_modele_message', 'id_modele_message');
    }

    public function scopeActif(Builder $query): Builder
    {
        return $query->where('actif', true);
    }

    public function scopeAutomatique(Builder $query): Builder
    {
        return $query->where('envoi_automatique', true);
    }
}

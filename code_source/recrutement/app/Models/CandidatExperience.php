<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class CandidatExperience extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_experience';

    public function getTable()
    {
        if (Schema::hasTable('candidat_experience_professionnelle')) {
            return 'candidat_experience_professionnelle';
        }
        return 'experience_professionnelle';
    }

    protected $fillable = [
        'id_candidature',
        'id_candidat',
        'poste',
        'entreprise',
        'date_debut',
        'date_fin',
        'poste_actuel',
        'description',
        'source',
        'valide',
    ];

    protected $casts = [
        'valide' => 'boolean',
        'poste_actuel' => 'boolean',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    protected $appends = ['intitule_poste'];

    public function getIntitulePosteAttribute(): string
    {
        return $this->attributes['poste'] ?? '';
    }

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'id_candidat', 'id_candidat');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidatProjet extends Model
{
    use HasFactory;

    protected $table = 'candidat_projet';
    protected $primaryKey = 'id_projet';

    protected $fillable = [
        'id_candidature',
        'titre_projet',
        'role',
        'technologies',
        'url_projet',
        'date_debut',
        'date_fin',
        'description',
        'source',
        'score_confiance',
        'id_document',
        'valide',
        'date_validation',
        'valide_par',
    ];

    protected $casts = [
        'valide' => 'boolean',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'score_confiance' => 'float',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }
}

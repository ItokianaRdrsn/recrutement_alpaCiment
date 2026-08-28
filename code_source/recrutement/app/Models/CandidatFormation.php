<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidatFormation extends Model
{
    use HasFactory;

    protected $table = 'formation';
    protected $primaryKey = 'id_formation';

    protected $fillable = [
        'id_candidat',
        'diplome',
        'etablissement',
        'annee_obtention',
        'domaine_etude',
        'valide',
    ];

    protected $casts = [
        'valide' => 'boolean',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'id_candidat', 'id_candidat');
    }
}

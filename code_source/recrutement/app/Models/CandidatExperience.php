<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidatExperience extends Model
{
    use HasFactory;

    protected $table = 'experience_professionnelle';
    protected $primaryKey = 'id_experience';

    protected $fillable = [
        'id_candidat',
        'intitule_poste',
        'entreprise',
        'date_debut',
        'date_fin',
        'description',
        'valide',
    ];

    protected $casts = [
        'valide' => 'boolean',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'id_candidat', 'id_candidat');
    }
}

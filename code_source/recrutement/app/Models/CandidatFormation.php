<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class CandidatFormation extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_formation';

    public function getTable()
    {
        if (Schema::hasTable('candidat_formation')) {
            return 'candidat_formation';
        }
        return 'formation';
    }

    protected $fillable = [
        'id_candidature',
        'id_candidat',
        'diplome',
        'etablissement',
        'domaine_etude',
        'niveau',
        'date_obtention',
        'source',
        'valide',
    ];

    protected $casts = [
        'valide' => 'boolean',
        'date_obtention' => 'date',
    ];

    protected $appends = ['annee_obtention'];

    public function getAnneeObtentionAttribute(): ?int
    {
        if (empty($this->attributes['date_obtention'])) {
            return null;
        }
        return (int) date('Y', strtotime($this->attributes['date_obtention']));
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

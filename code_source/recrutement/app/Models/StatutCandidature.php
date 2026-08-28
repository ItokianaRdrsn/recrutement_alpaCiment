<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StatutCandidature extends Model
{
    use HasFactory;

    protected $table = 'statut_candidature';
    protected $primaryKey = 'id_statut_candidature';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
        'ordre_workflow',
    ];

    public function candidatures(): HasMany
    {
        return $this->hasMany(Candidature::class, 'id_statut_candidature', 'id_statut_candidature');
    }
}

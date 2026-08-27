<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Competence extends Model
{
    protected $table = 'competence';

    protected $primaryKey = 'id_competence';

    protected $fillable = [
        'nom_competence',
        'id_type_competence',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(TypeCompetence::class, 'id_type_competence', 'id_type_competence');
    }

    public function offres(): BelongsToMany
    {
        return $this->belongsToMany(Offre::class, 'profil_competence', 'id_competence', 'id_offre')
            ->withPivot('niveau_requis');
    }
}

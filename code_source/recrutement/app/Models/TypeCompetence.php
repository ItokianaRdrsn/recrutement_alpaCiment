<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeCompetence extends Model
{
    protected $table = 'type_competence';

    protected $primaryKey = 'id_type_competence';

    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];

    public function competences(): HasMany
    {
        return $this->hasMany(Competence::class, 'id_type_competence', 'id_type_competence');
    }
}

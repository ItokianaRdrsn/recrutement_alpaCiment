<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatutCandidature extends Model
{
    protected $table = 'statut_candidature';

    protected $primaryKey = 'id_statut_candidature';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'libelle',
        'ordre_workflow',
    ];
}

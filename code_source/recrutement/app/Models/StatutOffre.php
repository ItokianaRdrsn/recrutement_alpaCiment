<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StatutOffre extends Model
{
    protected $table = 'statut_offre';

    protected $primaryKey = 'id_statut_offre';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'libelle',
        'ordre_workflow',
    ];

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'id_statut_offre', 'id_statut_offre');
    }
}

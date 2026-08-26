<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilOffre extends Model
{
    protected $table = 'profil_offre';

    protected $primaryKey = 'id_profil_offre';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_offre',
        'description',
        'type_valeur',
        'valeur_min',
        'valeur_max',
        'valeur_attendue',
        'unite_valeur',
    ];

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }
}

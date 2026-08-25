<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfilFormation extends Model
{
    protected $table = 'profil_formation';

    protected $primaryKey = 'id_profil_formation';

    public $timestamps = false;

    const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_profil_offre',
        'niveau_min',
        'niveau_max',
        'domaine',
        'obligatoire',
    ];

    protected function casts(): array
    {
        return [
            'obligatoire' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    public function profilOffre(): BelongsTo
    {
        return $this->belongsTo(ProfilOffre::class, 'id_profil_offre', 'id_profil_offre');
    }
}

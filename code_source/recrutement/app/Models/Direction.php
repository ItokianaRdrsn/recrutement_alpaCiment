<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Direction extends Model
{
    protected $table = 'direction';

    protected $primaryKey = 'id_direction';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nom_direction',
    ];

    public function domaines(): HasMany
    {
        return $this->hasMany(Domaine::class, 'id_direction', 'id_direction');
    }

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'id_direction', 'id_direction');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeContrat extends Model
{
    protected $table = 'type_contrat';

    protected $primaryKey = 'id_type_contrat';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'libelle',
    ];

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'id_type_contrat', 'id_type_contrat');
    }
}

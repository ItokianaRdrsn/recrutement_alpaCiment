<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TypeDemande extends Model
{
    protected $table = 'type_demande';

    protected $primaryKey = 'id_type_demande';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'libelle',
    ];
}

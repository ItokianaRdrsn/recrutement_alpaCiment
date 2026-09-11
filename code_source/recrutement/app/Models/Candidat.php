<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidat extends Model
{
    use HasFactory;

    protected $table = 'candidat';
    protected $primaryKey = 'id_candidat';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'date_naissance',
    ];

    public function candidatures(): HasMany
    {
        return $this->hasMany(Candidature::class, 'id_candidat', 'id_candidat');
    }
}

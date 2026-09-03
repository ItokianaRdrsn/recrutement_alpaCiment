<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lieu extends Model
{
    use HasFactory;

    protected $table = 'lieu';
    protected $primaryKey = 'id_lieu';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];

    public function offres(): HasMany
    {
        return $this->hasMany(Offre::class, 'id_lieu', 'id_lieu');
    }
}

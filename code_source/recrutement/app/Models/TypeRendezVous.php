<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TypeRendezVous extends Model
{
    use HasFactory;

    protected $table = 'type_rendez_vous';
    protected $primaryKey = 'id_type_rendez_vous';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];
}

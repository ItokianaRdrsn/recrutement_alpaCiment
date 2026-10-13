<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StatutRendezVous extends Model
{
    use HasFactory;

    protected $table = 'statut_rendez_vous';
    protected $primaryKey = 'id_statut_rendez_vous';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
        'ordre_workflow',
    ];
}

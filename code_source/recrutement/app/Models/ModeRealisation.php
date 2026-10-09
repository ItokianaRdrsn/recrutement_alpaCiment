<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModeRealisation extends Model
{
    use HasFactory;

    protected $table = 'mode_realisation';
    protected $primaryKey = 'id_mode_realisation';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];
}

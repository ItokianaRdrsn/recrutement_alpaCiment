<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TypeMessage extends Model
{
    use HasFactory;

    protected $table = 'type_message';
    protected $primaryKey = 'id_type_message';
    public $timestamps = false;

    protected $fillable = [
        'libelle',
    ];

    public function modeles(): HasMany
    {
        return $this->hasMany(ModeleMessage::class, 'id_type_message', 'id_type_message');
    }

    public function communications(): HasMany
    {
        return $this->hasMany(Communication::class, 'id_type_message', 'id_type_message');
    }
}

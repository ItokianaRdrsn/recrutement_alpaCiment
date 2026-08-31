<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Domaine extends Model
{
    protected $table = 'domaine';

    protected $primaryKey = 'id_domaine';

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'nom_domaine',
        'id_direction',
        'valide',
        'date_validation',
        'valide_par',
    ];

    protected function casts(): array
    {
        return [
            'valide' => 'boolean',
            'date_validation' => 'datetime',
        ];
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'id_direction', 'id_direction');
    }

    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valide_par');
    }
}

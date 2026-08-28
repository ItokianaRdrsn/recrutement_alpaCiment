<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VivierCandidat extends Model
{
    use HasFactory;

    protected $table = 'vivier_candidat';
    protected $primaryKey = 'id_vivier_candidat';

    protected $fillable = [
        'id_candidat',
        'id_direction',
        'id_domaine',
        'motif_ajout',
        'statut',
    ];

    public function candidat(): BelongsTo
    {
        return $this->belongsTo(Candidat::class, 'id_candidat', 'id_candidat');
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'id_direction', 'id_direction');
    }

    public function domaine(): BelongsTo
    {
        return $this->belongsTo(Domaine::class, 'id_domaine', 'id_domaine');
    }
}

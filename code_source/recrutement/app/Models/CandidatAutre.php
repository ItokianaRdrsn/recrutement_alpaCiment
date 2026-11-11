<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CandidatAutre extends Model
{
    use HasFactory;

    protected $table = 'candidat_autre';
    protected $primaryKey = 'id_autre';

    protected $fillable = [
        'id_candidature',
        'titre',
        'description',
        'source',
        'valide',
    ];

    protected $casts = [
        'valide' => 'boolean',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }
}

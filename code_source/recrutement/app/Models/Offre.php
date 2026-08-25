<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Offre extends Model
{
    protected $table = 'offre';

    protected $primaryKey = 'id_offre';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'titre_poste',
        'id_direction',
        'description',
        'lieu',
        'type_contrat',
        'date_publication',
        'date_limite',
        'id_statut_offre',
    ];

    protected function casts(): array
    {
        return [
            'date_publication' => 'date',
            'date_limite' => 'date',
        ];
    }

    public function direction(): BelongsTo
    {
        return $this->belongsTo(Direction::class, 'id_direction', 'id_direction');
    }

    public function statut(): BelongsTo
    {
        return $this->belongsTo(StatutOffre::class, 'id_statut_offre', 'id_statut_offre');
    }

    public function profil(): HasOne
    {
        return $this->hasOne(ProfilOffre::class, 'id_offre', 'id_offre');
    }

    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'id_offre', 'id_offre')->orderBy('ordre');
    }
}

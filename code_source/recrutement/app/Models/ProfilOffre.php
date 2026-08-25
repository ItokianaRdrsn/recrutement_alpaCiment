<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProfilOffre extends Model
{
    protected $table = 'profil_offre';

    protected $primaryKey = 'id_profil_offre';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_offre',
        'description',
        'experience_min_annees',
        'experience_max_annees',
    ];

    protected function casts(): array
    {
        return [
            'experience_min_annees' => 'decimal:1',
            'experience_max_annees' => 'decimal:1',
        ];
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }

    public function formations(): HasMany
    {
        return $this->hasMany(ProfilFormation::class, 'id_profil_offre', 'id_profil_offre');
    }
}

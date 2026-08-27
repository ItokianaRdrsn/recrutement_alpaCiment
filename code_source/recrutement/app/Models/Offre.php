<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'id_type_contrat',
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

    public function typeContrat(): BelongsTo
    {
        return $this->belongsTo(TypeContrat::class, 'id_type_contrat', 'id_type_contrat');
    }

    public function profils(): HasMany
    {
        return $this->hasMany(ProfilOffre::class, 'id_offre', 'id_offre');
    }

    public function profil(): HasOne
    {
        return $this->hasOne(ProfilOffre::class, 'id_offre', 'id_offre');
    }

    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class, 'id_offre', 'id_offre')->orderBy('ordre');
    }

    public function formations(): HasMany
    {
        return $this->hasMany(ProfilFormation::class, 'id_offre', 'id_offre');
    }

    public function competences(): BelongsToMany
    {
        return $this->belongsToMany(Competence::class, 'profil_competence', 'id_offre', 'id_competence')
            ->withPivot('niveau_requis');
    }
}

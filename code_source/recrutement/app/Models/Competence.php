<?php

namespace App\Models;

use App\Support\CompetenceMatcher;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Competence extends Model
{
    protected $table = 'competence';

    protected $primaryKey = 'id_competence';

    public $timestamps = false;

    protected $fillable = [
        'nom_competence',
        'id_type_competence',
    ];

    /**
     * Retrouve une compétence existante du référentiel (exacte ou variante proche, voir CompetenceMatcher),
     * sinon la crée. Évite les doublons (« python » / « Python », « Node.js » / « NodeJS ») à l'import OCR.
     *
     * @param  array<string, mixed>  $values  attributs à la création uniquement
     */
    public static function trouverOuCreer(string $nom, array $values = []): self
    {
        $nom = trim($nom);

        $trouve = CompetenceMatcher::trouver($nom, CompetenceMatcher::indexer(
            static::query()->pluck('nom_competence')->all()
        ));

        if ($trouve !== null) {
            $existante = static::query()->where('nom_competence', $trouve['nom'])->first();
            if ($existante !== null) {
                return $existante;
            }
        }

        return static::firstOrCreate(['nom_competence' => $nom], $values);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(TypeCompetence::class, 'id_type_competence', 'id_type_competence');
    }

    public function offres(): BelongsToMany
    {
        return $this->belongsToMany(Offre::class, 'profil_competence', 'id_competence', 'id_offre')
            ->withPivot('niveau_requis');
    }
}

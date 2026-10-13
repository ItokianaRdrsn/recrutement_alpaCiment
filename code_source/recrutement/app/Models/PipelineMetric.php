<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PipelineMetric extends Model
{
    protected $table = 'pipeline_metrics';
    protected $primaryKey = 'id_metric';

    protected $fillable = [
        'id_candidature',
        'id_offre',
        'cle_idempotence',
        'email_expediteur',
        'sujet_email',
        'intention',
        'statut',
        'duree_classification_s',
        'duree_ocr_s',
        'duree_ner_s',
        'duree_totale_s',
        'nb_caracteres_ocr',
        'nb_competences',
        'nb_experiences',
        'nb_projets',
        'nb_formations',
        'noeud_erreur',
        'message_erreur',
    ];

    protected $casts = [
        'duree_classification_s' => 'float',
        'duree_ocr_s' => 'float',
        'duree_ner_s' => 'float',
        'duree_totale_s' => 'float',
        'nb_caracteres_ocr' => 'integer',
        'nb_competences' => 'integer',
        'nb_experiences' => 'integer',
        'nb_projets' => 'integer',
        'nb_formations' => 'integer',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }
}

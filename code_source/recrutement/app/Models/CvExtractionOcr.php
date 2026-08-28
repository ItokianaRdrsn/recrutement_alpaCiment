<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CvExtractionOcr extends Model
{
    use HasFactory;

    protected $table = 'cv_extraction_ocr';
    protected $primaryKey = 'id_extraction';

    protected $fillable = [
        'id_candidature',
        'texte_brut_ocr',
        'donnees_json',
        'statut_validation',
        'commentaire_rh',
    ];

    protected $casts = [
        'donnees_json' => 'array',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Communication extends Model
{
    use HasFactory;

    protected $table = 'communication';
    protected $primaryKey = 'id_communication';
    public $timestamps = false; // Utilise uniquement date_envoi

    protected $fillable = [
        'id_candidature',
        'id_modele_message',
        'id_type_message',
        'objet',
        'contenu',
        'mode_envoi',
        'date_envoi',
        'id_utilisateur',
    ];

    protected $casts = [
        'date_envoi' => 'datetime',
    ];

    public function candidature(): BelongsTo
    {
        return $this->belongsTo(Candidature::class, 'id_candidature', 'id_candidature');
    }

    public function modeleMessage(): BelongsTo
    {
        return $this->belongsTo(ModeleMessage::class, 'id_modele_message', 'id_modele_message');
    }

    public function typeMessage(): BelongsTo
    {
        return $this->belongsTo(TypeMessage::class, 'id_type_message', 'id_type_message');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
}

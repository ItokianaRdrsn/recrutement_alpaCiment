<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_log';
    protected $primaryKey = 'id_audit_log';
    public $timestamps = false; // Seul created_at est utilisé

    protected $fillable = [
        'id_utilisateur',
        'action',
        'entite',
        'id_entite',
        'description',
        'anciennes_valeurs',
        'nouvelles_valeurs',
        'ip_adresse',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'anciennes_valeurs' => 'array',
        'nouvelles_valeurs' => 'array',
        'created_at' => 'datetime',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'id_utilisateur');
    }
}

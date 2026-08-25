<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mission extends Model
{
    protected $table = 'mission';

    protected $primaryKey = 'id_mission';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'id_offre',
        'description',
        'ordre',
    ];

    public function offre(): BelongsTo
    {
        return $this->belongsTo(Offre::class, 'id_offre', 'id_offre');
    }
}

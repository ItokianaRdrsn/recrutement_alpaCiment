<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Niveau;
use Illuminate\Http\JsonResponse;

class NiveauController extends Controller
{
    public function index(): JsonResponse
    {
        $niveaux = Niveau::orderBy('id_niveau')->get();
        return response()->json([
            'data' => $niveaux,
        ]);
    }
}

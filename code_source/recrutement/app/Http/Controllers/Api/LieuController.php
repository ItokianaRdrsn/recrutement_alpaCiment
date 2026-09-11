<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lieu;
use Illuminate\Http\JsonResponse;

class LieuController extends Controller
{
    public function index(): JsonResponse
    {
        $lieux = Lieu::orderBy('libelle')->get();
        return response()->json([
            'data' => $lieux,
        ]);
    }
}

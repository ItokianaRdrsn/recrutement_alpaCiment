<?php

namespace App\Http\Controllers;

use Illuminate\View\View;

class OffreController extends Controller
{
    public function index(): View
    {
        return view('backoffice');
    }
}

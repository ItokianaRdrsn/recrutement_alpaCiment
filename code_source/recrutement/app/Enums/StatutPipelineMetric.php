<?php

namespace App\Enums;

enum StatutPipelineMetric: string
{
    case Succes = 'succes';
    case DoublonIgnore = 'doublon_ignore';
    case Erreur = 'erreur';
}

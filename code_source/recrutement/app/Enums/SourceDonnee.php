<?php

namespace App\Enums;

enum SourceDonnee: string
{
    case Manuel = 'manuel';
    case CvOcr = 'cv_ocr';
    case Ocr = 'ocr';
}

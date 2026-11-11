<?php

namespace App\Repositories\Contracts;

use App\Models\PipelineMetric;

interface PipelineMetricRepositoryInterface
{
    public function create(array $attributes): PipelineMetric;
}

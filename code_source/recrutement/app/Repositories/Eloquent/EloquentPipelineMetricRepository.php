<?php

namespace App\Repositories\Eloquent;

use App\Models\PipelineMetric;
use App\Repositories\Contracts\PipelineMetricRepositoryInterface;

class EloquentPipelineMetricRepository implements PipelineMetricRepositoryInterface
{
    public function create(array $attributes): PipelineMetric
    {
        return PipelineMetric::create($attributes);
    }
}

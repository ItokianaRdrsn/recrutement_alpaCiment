<?php

namespace App\Services;

use App\Models\Direction;
use App\Repositories\Contracts\DirectionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class DirectionService
{
    public function __construct(
        protected DirectionRepositoryInterface $directionRepository
    ) {}

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        return $this->directionRepository->paginateFiltered($filters, $perPage);
    }

    public function find(int $id): Direction
    {
        return $this->directionRepository->findById($id);
    }

    public function create(array $data): Direction
    {
        return $this->directionRepository->create($data);
    }

    public function update(Direction $direction, array $data): Direction
    {
        $this->directionRepository->update($direction, $data);
        return $this->directionRepository->findById($direction->id_direction);
    }

    public function delete(Direction $direction): void
    {
        if ($this->directionRepository->isUsed($direction)) {
            abort(422, 'Impossible de supprimer une direction deja utilisee.');
        }

        $this->directionRepository->delete($direction);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Enums\TypeDocumentEnum;
use App\Exceptions\DocumentStorageException;
use App\Http\Controllers\Controller;
use App\Models\Candidature;
use App\Services\AuditLogService;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function __construct(
        protected DocumentService $documentService,
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Ajoute un document (CV à jour, photo, lettre, diplôme, autre pièce) à une candidature existante.
     * Le contrôle du contenu réel (PDF, Word, ODT, images) et de la taille (10 Mo) est fait par DocumentService.
     *
     * Champs multipart : fichier (obligatoire), type_document (CV | Photo | Autre), description (libellé facultatif).
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $candidature = Candidature::findOrFail($id);

        $data = $request->validate([
            'fichier' => ['required', 'file', 'max:' . (DocumentService::MAX_FILE_SIZE / 1024)],
            'type_document' => ['required', Rule::in(array_column(TypeDocumentEnum::cases(), 'value'))],
            'description' => ['nullable', 'string', 'max:150'],
        ]);

        $type = TypeDocumentEnum::from($data['type_document']);
        $dossier = match ($type) {
            TypeDocumentEnum::Cv => 'documents/cv',
            TypeDocumentEnum::Photo => 'documents/photos',
            TypeDocumentEnum::Autre => 'documents/annexes',
        };

        $fichiersCrees = [];

        try {
            $document = $this->documentService->stockerDocument(
                $candidature->id_candidature,
                $request->file('fichier'),
                $type,
                $dossier,
                $fichiersCrees
            );

            if (! empty($data['description'])) {
                $document->update(['description' => trim($data['description'])]);
            }
        } catch (DocumentStorageException $e) {
            $this->documentService->supprimerFichiers($fichiersCrees);

            return response()->json(['message' => $e->getMessage()], 422);
        }

        $this->auditLogService->log(
            'AJOUT_DOCUMENT',
            'candidature',
            $candidature->id_candidature,
            "Document ajouté ({$type->value}) : {$document->nom_fichier}"
        );

        return response()->json(['message' => 'Document ajouté.', 'data' => $document], 201);
    }
}

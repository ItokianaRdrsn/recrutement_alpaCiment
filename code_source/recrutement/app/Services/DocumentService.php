<?php

namespace App\Services;

use App\Enums\TypeDocumentEnum;
use App\Exceptions\DocumentStorageException;
use App\Models\Document;
use App\Repositories\Contracts\CandidatureRepositoryInterface;
use finfo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentService
{
    public const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
    public const DISK = 'public';

    public function __construct(
        protected CandidatureRepositoryInterface $candidatureRepository
    ) {}

    /**
     * Enregistre un fichier binaire UploadedFile (CV, Photo ou Annexe) avec contrôle MIME et UUID serveur.
     */
    public function stockerDocument(
        int $candidatureId,
        UploadedFile $file,
        string|TypeDocumentEnum $type,
        string $dossier,
        array &$fichiersCrees = []
    ): Document {
        $typeVal = $type instanceof TypeDocumentEnum ? $type->value : $type;
        $isPhoto = $type instanceof TypeDocumentEnum ? ($type === TypeDocumentEnum::Photo) : ($type === 'Photo');

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new DocumentStorageException("Le fichier {$file->getClientOriginalName()} dépasse la taille maximale autorisée de 10 Mo.");
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file->getPathname()) ?: ($file->getMimeType() ?: 'application/octet-stream');
        $ext = $this->resoudreExtension($mime, $file->getClientOriginalName(), $isPhoto);

        $safeName = Str::uuid() . '.' . $ext;
        $path = $dossier . '/' . $safeName;

        if (Storage::disk(self::DISK)->putFileAs($dossier, $file, $safeName) === false) {
            throw new DocumentStorageException("Échec d'écriture physique sur le disque pour {$file->getClientOriginalName()}.");
        }

        $fichiersCrees[] = $path;

        return $this->candidatureRepository->createDocument([
            'id_candidature' => $candidatureId,
            'type_document' => $typeVal,
            'nom_fichier' => basename($file->getClientOriginalName()),
            'chemin_fichier' => $path,
            'taille_octets' => $file->getSize(),
            'mime_type' => $mime,
            'description' => "Pièce jointe {$typeVal}",
        ]);
    }

    /**
     * Décode et enregistre un CV encodé en Base64 (n8n / webhook externe).
     */
    public function stockerCvBase64(
        int $candidatureId,
        string $base64,
        string $clientNom = 'cv.pdf',
        array &$fichiersCrees = []
    ): Document {
        if (str_contains($base64, ';base64,')) {
            $parts = explode(';base64,', $base64);
            $base64 = end($parts);
        }

        $decoded = base64_decode($base64, true);
        if ($decoded === false || empty($decoded)) {
            throw new DocumentStorageException("Le contenu Base64 du CV est corrompu ou invalide.");
        }

        $taille = strlen($decoded);
        if ($taille > self::MAX_FILE_SIZE) {
            throw new DocumentStorageException("Le CV en Base64 dépasse la taille maximale autorisée de 10 Mo.");
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($decoded) ?: 'application/octet-stream';
        $ext = $this->resoudreExtension($mime, $clientNom, false);

        $safeName = Str::uuid() . '.' . $ext;
        $path = 'documents/cv/' . $safeName;

        if (Storage::disk(self::DISK)->put($path, $decoded) === false) {
            throw new DocumentStorageException("Échec d'écriture du CV Base64 sur le disque.");
        }

        $fichiersCrees[] = $path;

        return $this->candidatureRepository->createDocument([
            'id_candidature' => $candidatureId,
            'type_document' => TypeDocumentEnum::Cv->value,
            'nom_fichier' => basename($clientNom),
            'chemin_fichier' => $path,
            'taille_octets' => $taille,
            'mime_type' => $mime,
            'description' => 'Curriculum Vitae (Import Base64)',
        ]);
    }

    /**
     * Supprime physiquement les fichiers orphelins (utilisé lors d'un rollback SQL).
     */
    public function supprimerFichiers(array $paths): void
    {
        foreach ($paths as $path) {
            try {
                if (Storage::disk(self::DISK)->exists($path)) {
                    Storage::disk(self::DISK)->delete($path);
                }
            } catch (\Throwable $e) {
                Log::warning("Impossible de supprimer le fichier orphelin [{$path}]: " . $e->getMessage());
            }
        }
    }

    /**
     * Valide et résout l'extension de fichier selon une liste blanche stricte.
     */
    public function resoudreExtension(string $mime, string $clientNom, bool $isPhoto): string
    {
        $mime = strtolower(trim($mime));
        $ext = strtolower(pathinfo($clientNom, PATHINFO_EXTENSION));

        if ($isPhoto) {
            $photoMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
            if (!isset($photoMimes[$mime])) {
                throw new DocumentStorageException("Format photo non autorisé : [{$mime}]. Seuls JPG, PNG et WebP sont acceptés.");
            }
            return $photoMimes[$mime];
        }

        // Support DOCX / ODT (souvent détectés comme archives zip)
        if (in_array($mime, ['application/zip', 'application/x-zip', 'application/x-zip-compressed'], true) && in_array($ext, ['docx', 'odt'], true)) {
            return $ext;
        }

        // Support DOC binaire (OLE storage / CDFV2)
        if (in_array($mime, ['application/x-ole-storage', 'application/cdfv2', 'application/x-cfb', 'application/msword'], true)) {
            return 'doc';
        }

        $whitelist = [
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.oasis.opendocument.text' => 'odt',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
        ];

        if (!isset($whitelist[$mime])) {
            throw new DocumentStorageException("Type de fichier non autorisé : [{$mime}]. Seuls PDF, Word, ODT et images sont acceptés.");
        }

        return $whitelist[$mime];
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for audit_log table.
     */
    public function up(): void
    {
        if (! Schema::hasTable('audit_log')) {
            Schema::create('audit_log', function (Blueprint $table) {
                $table->id('id_audit_log');
                
                // Utilisateur responsable (nullable si action système / anonyme)
                $table->foreignId('id_utilisateur')
                    ->nullable()
                    ->constrained('utilisateur', 'id_utilisateur')
                    ->nullOnDelete();

                // Type d'action : CREATION, MODIFICATION, SUPPRESSION, CHANGEMENT_STATUT, VALIDATION_OCR, etc.
                $table->string('action', 50);

                // Entité ciblée : Offre, Candidature, Competence, Domaine, Direction, etc.
                $table->string('entite', 100);

                // Identifiant de l'entité ciblée (ex: id_offre=5, id_candidature=12)
                $table->unsignedBigInteger('id_entite')->nullable();

                // Résumé lisible de l'action (ex: "Création de l'offre IT-4", "Changement statut candidature #12: Reçue -> En cours")
                $table->string('description', 255)->nullable();

                // Détails des valeurs avant modification (JSON)
                $table->json('anciennes_valeurs')->nullable();

                // Détails des valeurs après modification (JSON)
                $table->json('nouvelles_valeurs')->nullable();

                // Métadonnées réseau
                $table->string('ip_adresse', 45)->nullable();
                $table->text('user_agent')->nullable();

                $table->timestampTz('created_at')->useCurrent();

                // Index pour recherches rapides dans le tableau de bord et filtres RH
                $table->index('action', 'idx_audit_log_action');
                $table->index('entite', 'idx_audit_log_entite');
                $table->index('id_entite', 'idx_audit_log_id_entite');
                $table->index('id_utilisateur', 'idx_audit_log_id_utilisateur');
                $table->index('created_at', 'idx_audit_log_created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_log');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations creating exact stored functions and dashboard views from gestion_recrutement.sql
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // Function valider_domaine
            DB::unprepared("
                CREATE OR REPLACE FUNCTION valider_domaine(
                    p_id_domaine BIGINT,
                    p_id_utilisateur BIGINT
                ) RETURNS BOOLEAN AS $$
                BEGIN
                    UPDATE domaine
                    SET valide = TRUE,
                        date_validation = now(),
                        valide_par = p_id_utilisateur,
                        updated_at = now()
                    WHERE id_domaine = p_id_domaine
                        AND valide = FALSE;
                    IF FOUND THEN RETURN TRUE;
                    ELSE RETURN FALSE;
                    END IF;
                END;
                $$ LANGUAGE plpgsql;
            ");

            // View vue_dashboard_kpis
            DB::statement("CREATE OR REPLACE VIEW vue_dashboard_kpis AS
                SELECT (
                    SELECT COUNT(*)
                    FROM candidature c
                        JOIN type_demande td ON td.id_type_demande = c.id_type_demande
                    WHERE td.libelle = 'Offre'
                ) AS candidatures_sur_offre,
                (
                    SELECT COUNT(*)
                    FROM offre o
                        JOIN statut_offre so ON so.id_statut_offre = o.id_statut_offre
                    WHERE so.libelle = 'Publiee'
                ) AS offres_en_cours,
                (
                    SELECT COUNT(*)
                    FROM candidature c
                        JOIN type_demande td ON td.id_type_demande = c.id_type_demande
                    WHERE td.libelle = 'Spontanee'
                ) AS candidatures_spontanees;
            ");

            // View vue_stats_candidatures_par_mois
            DB::statement("CREATE OR REPLACE VIEW vue_stats_candidatures_par_mois AS
                SELECT date_trunc('month', date_candidature)::date AS mois,
                    COUNT(*) AS nombre_candidatures
                FROM candidature
                GROUP BY 1
                ORDER BY 1;
            ");

            // View vue_stats_repartition_statut_mois_courant
            DB::statement("CREATE OR REPLACE VIEW vue_stats_repartition_statut_mois_courant AS
                SELECT sc.libelle AS statut,
                    sc.ordre_workflow,
                    COUNT(*) AS nombre
                FROM candidature c
                    JOIN statut_candidature sc ON sc.id_statut_candidature = c.id_statut_candidature
                WHERE date_trunc('month', c.date_candidature) = date_trunc('month', CURRENT_DATE)
                GROUP BY sc.libelle,
                    sc.ordre_workflow
                ORDER BY sc.ordre_workflow;
            ");

            // View vue_stats_taux_transformation_mensuel
            DB::statement("CREATE OR REPLACE VIEW vue_stats_taux_transformation_mensuel AS
                SELECT date_trunc('month', c.date_candidature)::date AS mois,
                    COUNT(*) AS total_candidatures,
                    COUNT(*) FILTER (
                        WHERE sc.libelle = 'Retenue'
                    ) AS candidatures_retenues,
                    ROUND(
                        COUNT(*) FILTER (
                            WHERE sc.libelle = 'Retenue'
                        )::numeric / NULLIF(COUNT(*), 0) * 100,
                        2
                    ) AS taux_transformation_pct
                FROM candidature c
                    JOIN statut_candidature sc ON sc.id_statut_candidature = c.id_statut_candidature
                GROUP BY 1
                ORDER BY 1;
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DROP VIEW IF EXISTS vue_stats_taux_transformation_mensuel CASCADE;");
            DB::statement("DROP VIEW IF EXISTS vue_stats_repartition_statut_mois_courant CASCADE;");
            DB::statement("DROP VIEW IF EXISTS vue_stats_candidatures_par_mois CASCADE;");
            DB::statement("DROP VIEW IF EXISTS vue_dashboard_kpis CASCADE;");
            DB::statement("DROP FUNCTION IF EXISTS valider_domaine CASCADE;");
        }
    }
};

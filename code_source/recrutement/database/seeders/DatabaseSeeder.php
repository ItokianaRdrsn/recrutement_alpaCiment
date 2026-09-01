<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate([
            'email' => 'admin@alphaciment.local',
        ], [
            'nom' => 'Administrateur RH',
            'role' => UserRole::Admin->value,
            'mot_de_passe' => Hash::make('password'),
        ]);

        foreach ([
            ['Dupont Jean', 'jean.dupont@entreprise.com', 'admin'],
            ['Martin Sophie', 'sophie.martin@entreprise.com', 'rh'],
            ['Bernard Pierre', 'pierre.bernard@entreprise.com', 'manager'],
            ['Durand Marie', 'marie.durand@entreprise.com', 'rh'],
            ['Petit Luc', 'luc.petit@entreprise.com', 'manager'],
        ] as [$nom, $email, $role]) {
            DB::table('utilisateur')->updateOrInsert([
                'email' => $email,
            ], [
                'nom' => $nom,
                'role' => $role,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach ([
            'Informatique',
            'Ressources Humaines',
            'Finance',
            'Marketing',
            'Commercial',
        ] as $direction) {
            DB::table('direction')->updateOrInsert([
                'nom_direction' => $direction,
            ]);
        }

        foreach (['Offre', 'Spontanee'] as $typeDemande) {
            DB::table('type_demande')->updateOrInsert([
                'libelle' => $typeDemande,
            ]);
        }

        foreach ([
            ['Brouillon', 1],
            ['Publiee', 2],
            ['Cloturee', 3],
        ] as [$statutOffre, $ordre]) {
            DB::table('statut_offre')->updateOrInsert([
                'libelle' => $statutOffre,
            ], [
                'ordre_workflow' => $ordre,
            ]);
        }

        foreach (['CDI', 'CDD', 'Stage', 'Interim', 'Consultance'] as $typeContrat) {
            DB::table('type_contrat')->updateOrInsert([
                'libelle' => $typeContrat,
            ]);
        }

        foreach ([
            ['Recue', 10],
            ['Preselectionnee', 20],
            ['Test', 30],
            ['Entretien', 40],
            ['Retenue', 50],
            ['Non retenue', 50],
        ] as [$libelle, $ordre]) {
            DB::table('statut_candidature')->updateOrInsert([
                'libelle' => $libelle,
            ], [
                'ordre_workflow' => $ordre,
            ]);
        }

        $directionId = fn (string $nom): int => (int) DB::table('direction')
            ->where('nom_direction', $nom)
            ->value('id_direction');

        foreach ([
            ['Developpement Web', 'Informatique', true],
            ['Developpement Mobile', 'Informatique', true],
            ['Base de Donnees', 'Informatique', false],
            ['Recrutement', 'Ressources Humaines', true],
            ['Formation', 'Ressources Humaines', false],
            ['Comptabilite', 'Finance', true],
            ['Tresorerie', 'Finance', false],
            ['Communication Digitale', 'Marketing', true],
            ['Relations Publiques', 'Marketing', false],
            ['Ventes B2B', 'Commercial', true],
        ] as [$domaine, $direction, $valide]) {
            DB::table('domaine')->updateOrInsert([
                'nom_domaine' => $domaine,
            ], [
                'id_direction' => $directionId($direction),
                'valide' => $valide,
                'date_validation' => $valide ? now() : null,
                'valide_par' => $valide ? $admin->id : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $statutOffreId = fn (string $libelle): int => (int) DB::table('statut_offre')
            ->where('libelle', $libelle)
            ->value('id_statut_offre');

        $typeContratId = fn (string $libelle): int => (int) DB::table('type_contrat')
            ->where('libelle', $libelle)
            ->value('id_type_contrat');

        foreach ([
            ['Developpeur Full Stack', 'Informatique', 'Publiee', 'Antananarivo', 'CDI', '2026-01-15', '2026-03-15'],
            ['Developpeur React Native', 'Informatique', 'Publiee', 'Antananarivo', 'CDI', '2026-02-01', '2026-04-01'],
            ['Data Engineer', 'Informatique', 'Publiee', 'Antananarivo', 'CDI', '2026-01-20', '2026-03-20'],
            ['Responsable Recrutement', 'Ressources Humaines', 'Cloturee', 'Antananarivo', 'CDI', '2026-01-10', '2026-02-10'],
            ['Comptable', 'Finance', 'Brouillon', 'Antananarivo', 'CDI', '2026-02-01', '2026-04-01'],
            ['Charge de Marketing Digital', 'Marketing', 'Publiee', 'Antananarivo', 'CDD', '2026-01-25', '2026-03-25'],
            ['Commercial Senior', 'Commercial', 'Publiee', 'Antananarivo', 'CDI', '2026-01-15', '2026-03-15'],
        ] as [$titre, $direction, $statut, $lieu, $contrat, $publication, $limite]) {
            DB::table('offre')->updateOrInsert([
                'titre_poste' => $titre,
            ], [
                'id_direction' => $directionId($direction),
                'id_statut_offre' => $statutOffreId($statut),
                'description' => "Offre de recrutement pour le poste {$titre}.",
                'lieu' => $lieu,
                'id_type_contrat' => $typeContratId($contrat),
                'date_publication' => $publication,
                'date_limite' => $limite,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}

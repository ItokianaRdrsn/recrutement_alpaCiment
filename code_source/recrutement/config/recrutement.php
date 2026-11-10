<?php

return [
    /*
    | Durée de conservation (en mois) d'un candidat en vivier sans nouvelle activité,
    | avant effacement automatique (commande `candidats:purger-vivier`).
    */
    'retention_vivier_mois' => (int) env('RETENTION_VIVIER_MOIS', 24),

    /*
    | Durée de conservation (en mois) d'une offre archivée (= clôturée) avant suppression automatique
    | (commande `offres:purger-archives`). Les candidatures liées sont conservées, détachées de l'offre.
    */
    'retention_offres_archivees_mois' => (int) env('RETENTION_OFFRES_ARCHIVEES_MOIS', 12),

    /*
    | Pondérations du matching candidat / offre. Les critères sans exigence dans l'offre sont
    | ignorés et les poids restants sont renormalisés.
    */
    'matching' => [
        'poids' => [
            'competences' => (int) env('MATCHING_POIDS_COMPETENCES', 50),
            'formation' => (int) env('MATCHING_POIDS_FORMATION', 30),
            'experience' => (int) env('MATCHING_POIDS_EXPERIENCE', 20),
        ],
    ],
];

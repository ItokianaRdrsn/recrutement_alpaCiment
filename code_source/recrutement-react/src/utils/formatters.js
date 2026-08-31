export function formatDate(value) {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('fr-FR').format(new Date(value));
}

export const emptyOfferForm = {
    id: null,
    titre_poste: '',
    id_direction: '',
    description: '',
    lieu: '',
    id_type_contrat: '',
    date_publication: '',
    date_limite: '',
    id_statut_offre: '',
    profils: [{ description: '', type_valeur: '', valeur_min: '', valeur_max: '', valeur_attendue: '', unite_valeur: '' }],
    missions: [{ description: '', ordre: 1 }],
    formations: [{ niveau_min: '', niveau_max: '', domaine: '', obligatoire: true }],
    competences: [],
};

export function offerPayload(form) {
    return {
        titre_poste: form.titre_poste.trim(),
        id_direction: form.id_direction ? Number(form.id_direction) : '',
        description: form.description.trim() || null,
        lieu: form.lieu.trim() || null,
        id_type_contrat: form.id_type_contrat ? Number(form.id_type_contrat) : null,
        date_publication: form.date_publication || null,
        date_limite: form.date_limite || null,
        id_statut_offre: form.id_statut_offre ? Number(form.id_statut_offre) : null,
        profils: form.profils.filter((p) => p.description.trim() || p.valeur_attendue.trim()),
        missions: form.missions.filter((m) => m.description.trim()),
        formations: form.formations.filter((f) => f.niveau_min.trim() || f.domaine.trim()),
        competences: form.competences,
    };
}

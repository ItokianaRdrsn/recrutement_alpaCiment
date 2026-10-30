/**
 * posterContentGenerator.js
 * 
 * Transforme intelligemment les données brutes d'une offre (champs du formulaire ou API)
 * en phrases fluides, naturelles et professionnelles pour l'affiche officielle de recrutement Alpha Ciment.
 */

export function formatDateFrench(dateValue) {
    if (!dateValue) return 'à définir';
    try {
        const d = new Date(dateValue);
        if (isNaN(d.getTime())) return String(dateValue);
        return new Intl.DateTimeFormat('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);
    } catch {
        return String(dateValue);
    }
}

/**
 * Découpe un intitulé de poste en lignes harmonieuses (ex: "Directrice\nCommerciale")
 */
export function formatTitleMultiline(title) {
    if (!title) return '';
    const trimmed = String(title).trim();
    if (trimmed.includes('\n')) return trimmed;
    const words = trimmed.split(/\s+/);
    if (words.length === 2) {
        return `${words[0]}\n${words[1]}`;
    }
    if (words.length === 3 && words[1].length <= 3) {
        // Ex: "Chef de dépôt" -> "Chef de\nDépôt"
        return `${words[0]} ${words[1]}\n${words[2]}`;
    }
    if (words.length === 3) {
        return `${words[0]}\n${words[1]}\n${words[2]}`;
    }
    return trimmed;
}

/**
 * Nettoie et capitalise une phrase
 */
function cleanSentence(text) {
    if (!text) return '';
    let t = String(text).trim();
    // Enlever puces existantes éventuelles
    t = t.replace(/^[-•*]\s*/, '');
    if (!t) return '';
    return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Génère une référence Alpha Ciment pro si non existante
 */
export function generateReference(offer) {
    if (offer.reference && offer.reference.trim()) {
        return offer.reference.trim();
    }

    const lieu = (offer.lieu || 'TNR').trim().toUpperCase();
    let lieuCode = 'TNR';
    if (lieu.includes('TAMA') || lieu.includes('TOAM')) lieuCode = 'TAV';
    else if (lieu.includes('MAJ')) lieuCode = 'MJN';
    else if (lieu.includes('DIEGO') || lieu.includes('ANTS')) lieuCode = 'DIE';
    else if (lieu.includes('TOLI') || lieu.includes('TULE')) lieuCode = 'TLE';
    else if (lieu.includes('FIAN')) lieuCode = 'FIA';

    const titre = (offer.titre_poste || '').trim().toUpperCase();
    let codePoste = 'OFFRE';
    if (titre.includes('CHEF') && titre.includes('DEP')) codePoste = 'CD LOG';
    else if (titre.includes('MAGASIN')) codePoste = 'MG';
    else if (titre.includes('DEV') || titre.includes('INFO')) codePoste = 'SI-DEV';
    else if (titre.includes('COMPT') || titre.includes('FINAN')) codePoste = 'FIN';
    else if (titre.includes('RH') || titre.includes('RESSOUR')) codePoste = 'RH';
    else {
        // Prendre les premières lettres des mots significatifs
        const words = titre.split(/[\s-]+/).filter((w) => w.length > 2 && !['DES', 'LES', 'UNE', 'PAR', 'POUR'].includes(w));
        if (words.length > 0) {
            codePoste = words.slice(0, 2).map((w) => w.slice(0, 3)).join('-');
        }
    }

    return `${lieuCode} – ${codePoste}`;
}

/**
 * Génère le contenu complet prêt pour l'affiche
 */
export function generatePosterData(offer, referentiels = {}, allCompetences = []) {
    const rawTitle = (offer.titre_poste || '').trim();
    let prefix = 'Un(e)';
    let jobTitle = rawTitle || 'Poste à pourvoir';

    // Détecter si le titre inclut déjà "Un ", "Une ", "Un(e) "
    const prefixMatch = rawTitle.match(/^(un\(e\)|un|une)\s+/i);
    if (prefixMatch) {
        prefix = prefixMatch[1].charAt(0).toUpperCase() + prefixMatch[1].slice(1).toLowerCase();
        jobTitle = rawTitle.slice(prefixMatch[0].length).trim();
    }
    // Formater en ligne par ligne si pertinent (ex: "Directrice\nCommerciale")
    jobTitle = formatTitleMultiline(jobTitle);

    // Lieu
    let rawLieu = (offer.lieu || offer.lieuRef?.libelle || '').trim();
    if (!rawLieu && offer.id_lieu && referentiels.lieux) {
        const foundLieu = referentiels.lieux.find((l) => String(l.id_lieu) === String(offer.id_lieu));
        if (foundLieu) rawLieu = foundLieu.libelle;
    }
    const lieuClean = rawLieu || 'Tamatave';

    // Type contrat & durée
    let contratLibelle = 'CDI';
    if (offer.type_contrat?.libelle) {
        contratLibelle = offer.type_contrat.libelle;
    } else if (offer.id_type_contrat && referentiels.types_contrat) {
        const found = referentiels.types_contrat.find((tc) => String(tc.id_type_contrat) === String(offer.id_type_contrat));
        if (found) contratLibelle = found.libelle;
    }

    const dureeContrat = (offer.duree_contrat || '').trim();
    let contratTexte = contratLibelle.toUpperCase().startsWith('EN ') ? contratLibelle : `En ${contratLibelle}`;
    if (contratLibelle.toUpperCase().includes('CDD') && dureeContrat) {
        contratTexte = `En CDD (${dureeContrat.toUpperCase()})`;
    }

    // Direction
    let directionName = '';
    if (offer.direction?.nom) {
        directionName = offer.direction.nom;
    } else if (offer.id_direction && referentiels.directions) {
        const found = referentiels.directions.find((d) => String(d.id_direction) === String(offer.id_direction));
        if (found) directionName = found.nom_direction || found.nom || '';
    }
    directionName = directionName.trim();
    let directionPhrase = 'Poste rattaché à la direction générale.';
    if (directionName) {
        const cleanDir = directionName.replace(/^direction\s+/i, '').trim();
        directionPhrase = `Poste rattaché à la direction ${cleanDir.toLowerCase()}.`;
    }

    // Formatage du titre dans l'accroche (version 1 ligne)
    const singleLineTitle = jobTitle.replace(/\n+/g, ' ');
    let titleInQuotes = singleLineTitle;
    if (titleInQuotes === titleInQuotes.toUpperCase()) {
        titleInQuotes = titleInQuotes.charAt(0).toLowerCase() + titleInQuotes.slice(1).toLowerCase();
    } else if (!/^[A-Z]{2,}/.test(titleInQuotes)) {
        titleInQuotes = titleInQuotes.charAt(0).toLowerCase() + titleInQuotes.slice(1);
    }

    // Accroche / Description du poste
    let accroche = '';
    if (offer.description && offer.description.trim()) {
        const rawDesc = offer.description.trim();
        const rawLines = rawDesc.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (rawLines.length > 1) {
            accroche = rawLines.join('\n');
        } else {
            const splitMatch = rawDesc.match(/^(.*?[.!?»])\s+(Poste rattaché.*|Rattaché.*)$/i);
            if (splitMatch) {
                accroche = `${splitMatch[1].trim()}\n${splitMatch[2].trim()}`;
            } else {
                accroche = rawDesc.replace(/([.!?»])\s+([A-ZÀ-Ö])/g, '$1\n$2');
            }
        }
    } else {
        accroche = `Afin de renforcer notre équipe, nous recherchons un(e) « ${titleInQuotes} ».\n${directionPhrase}`;
    }

    // Missions formatées (strictement celles fournies dans l'offre, aucun ajout automatique)
    const missionsRaw = Array.isArray(offer.missions) ? offer.missions : [];
    const missions = missionsRaw
        .filter((m) => m && m.description && m.description.trim())
        .map((m) => cleanSentence(m.description));

    // Synthèse du Profil (strictement les critères de l'offre, aucun ajout automatique)
    const profilsSynthetises = [];

    // 1. Formations
    const formationsRaw = Array.isArray(offer.formations) ? offer.formations : [];
    formationsRaw.forEach((f) => {
        if (!f) return;
        const nMin = (f.niveau_min || '').trim();
        const nMax = (f.niveau_max || '').trim();
        const domaine = (f.domaine || '').trim();

        if (nMin && nMax) {
            profilsSynthetises.push(`Niveau ${nMin} à ${nMax} ${domaine ? 'avec formation en ' + domaine : ''}`);
        } else if (nMin) {
            if (/bac\s*\+\s*3/i.test(nMin)) {
                profilsSynthetises.push(`Niveau Bac + 3 minimum ${domaine ? 'avec formation ou expérience en ' + domaine : 'ou équivalent'}`);
            } else if (/bac\s*\+\s*2/i.test(nMin)) {
                profilsSynthetises.push(`Niveau Bac + 2 minimum ${domaine ? 'en ' + domaine : 'avec expérience significative'}`);
            } else if (/bac\s*\+\s*5/i.test(nMin)) {
                profilsSynthetises.push(`Diplôme d'Ingénieur ou Master (Bac + 5) ${domaine ? 'en ' + domaine : ''}`);
            } else if (/^bac/i.test(nMin)) {
                profilsSynthetises.push(`Minimum Baccalauréat avec expériences ou Bac + 2 ${domaine ? 'en ' + domaine : ''}`);
            } else {
                profilsSynthetises.push(`Niveau ${nMin} minimum ${domaine ? 'en ' + domaine : ''}`);
            }
        } else if (domaine) {
            profilsSynthetises.push(`Formation ou diplôme spécialisé en ${domaine}`);
        }
    });

    // 2. Critères chiffrés / Profils
    const profilsRaw = Array.isArray(offer.profils) ? offer.profils : offer.profil ? [offer.profil] : [];
    profilsRaw.forEach((p) => {
        if (!p) return;
        const desc = (p.description || '').trim();
        const vMin = p.valeur_min;
        const vMax = p.valeur_max;
        const vAtt = p.valeur_attendue;
        const unit = (p.unite_valeur || '').trim();

        if (/exp[ée]rience|ann[ée]e/i.test(desc) || p.type_valeur === 'experience') {
            if (vAtt) {
                profilsSynthetises.push(`Expérience professionnelle de ${vAtt} ${unit || 'ans'} minimum dans un poste similaire`);
            } else if (vMin && vMax) {
                profilsSynthetises.push(`${vMin} à ${vMax} ${unit || 'ans'} d'expérience avérée dans le domaine`);
            } else if (vMin) {
                profilsSynthetises.push(`Au moins ${vMin} ${unit || 'ans'} d'expérience dans une fonction similaire`);
            } else if (desc) {
                profilsSynthetises.push(cleanSentence(desc));
            }
        } else if (/^[^a-z]*[aâ]ge/i.test(desc)) {
            if (vMin && vMax) {
                profilsSynthetises.push(`Âge souhaité : entre ${vMin} et ${vMax} ans`);
            } else if (vMin) {
                profilsSynthetises.push(`Âge minimum : ${vMin} ans`);
            }
        } else if (desc) {
            if (vAtt) {
                profilsSynthetises.push(`${cleanSentence(desc)} : ${vAtt} ${unit}`);
            } else if (vMin && vMax) {
                profilsSynthetises.push(`${cleanSentence(desc)} : ${vMin} à ${vMax} ${unit}`);
            } else {
                profilsSynthetises.push(cleanSentence(desc));
            }
        }
    });

    // 3. Compétences
    const competencesRaw = Array.isArray(offer.competences) ? offer.competences : [];
    competencesRaw.forEach((c) => {
        if (!c) return;
        let cName = c.nom || c.nom_competence || '';
        if (!cName && c.id_competence && allCompetences.length > 0) {
            const found = allCompetences.find((item) => Number(item.id_competence || item.id) === Number(c.id_competence));
            if (found) cName = found.nom_competence || found.nom || '';
        }
        if (!cName) return;

        const niveau = c.niveau_requis || 'Intermediaire';
        const lower = cName.toLowerCase();

        if (/permis\s*b/i.test(lower) || /permis.*conduire/i.test(lower)) {
            profilsSynthetises.push(`Titulaire d'un permis de conduire B`);
        } else if (/fran[cç]ais/i.test(lower)) {
            profilsSynthetises.push(`Maîtrise du Français (oral et écrit)`);
        } else if (/anglais/i.test(lower)) {
            profilsSynthetises.push(`Bonne maîtrise de l'Anglais professionnel`);
        } else if (/excel|word|bureautique|pack office|informatique/i.test(lower)) {
            profilsSynthetises.push(`Maîtrise des outils informatiques bureautiques (${cName})`);
        } else if (/s[eé]curit[eé]|environnement|hse/i.test(lower)) {
            profilsSynthetises.push(`Bonne connaissance des procédures relatives à la sécurité et à l'environnement`);
        } else if (/iso/i.test(lower)) {
            profilsSynthetises.push(`Bonne maîtrise des procédures et normes ISO`);
        } else if (/stock|magasin/i.test(lower)) {
            profilsSynthetises.push(`Maîtrise des procédures de gestion de stocks`);
        } else if (/^(savoir|ma[iî]trise|connaissance|bonne|avoir|sens)/i.test(lower)) {
            profilsSynthetises.push(cleanSentence(cName));
        } else {
            if (niveau === 'Avance' || niveau === 'Expert') {
                profilsSynthetises.push(`Excellente maîtrise : ${cName}`);
            } else if (niveau === 'Debutant') {
                profilsSynthetises.push(`Notions de base en : ${cName}`);
            } else {
                profilsSynthetises.push(`Bonne maîtrise de : ${cName}`);
            }
        }
    });

    // Référence & date limite
    const reference = generateReference(offer);
    const dateLimiteTexte = formatDateFrench(offer.date_limite || '2026-09-30');

    // Appel candidature officiel
    const candidatureText = `Si vous êtes prêt à relever ces challenges avec nous, merci d’envoyer votre dossier de candidature (CV, références, prétentions salariales) à l’adresse mdg-service-rh@alphaciment.com sous la référence ${reference} avant le ${dateLimiteTexte}.`;

    return {
        prefix,
        jobTitle,
        lieu: `Poste basé à ${lieuClean}`,
        contrat: contratTexte,
        duree_contrat: dureeContrat,
        accroche,
        missions,
        profils: profilsSynthetises,
        reference,
        dateLimiteTexte,
        candidatureText,
    };
}

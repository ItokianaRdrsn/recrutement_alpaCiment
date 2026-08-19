const page = document.body.dataset.page || 'dashboard';
const toast = document.getElementById('toast');

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function setActiveNavigation() {
  document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
    const isActive = item.dataset.page === page;
    item.classList.toggle('active', isActive);
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });
}

function createOfferRow(title, status) {
  const template = document.getElementById('offer-row-template');
  if (!template) {
    return null;
  }

  const row = template.content.cloneNode(true);
  const titleCell = row.querySelector('.offer-title');
  const statusCell = row.querySelector('.offer-status');
  const countCell = row.querySelector('.offer-count');
  const copyButton = row.querySelector('.copy-link-btn');

  if (titleCell) {
    titleCell.textContent = title;
  }

  if (statusCell) {
    statusCell.textContent = status;
    statusCell.className = `status offer-status ${status === 'Publiée' ? 'open' : status === 'Brouillon' ? 'draft' : 'closed'}`;
  }

  if (countCell) {
    countCell.textContent = String(Math.floor(Math.random() * 25) + 1);
  }

  if (copyButton) {
    copyButton.dataset.copyLink = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    copyButton.addEventListener('click', () => {
      const url = `postuler.html?offre=${encodeURIComponent(copyButton.dataset.copyLink || '')}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      showToast(`Lien copié pour ${title}`);
    });
  }

  return row;
}

function wireDashboard() {
  const metrics = {
    applications: document.getElementById('metric-applications'),
    offers: document.getElementById('metric-offers'),
    spontaneous: document.getElementById('metric-spontaneous'),
    hired: document.getElementById('metric-hired'),
  };

  const refreshButton = document.getElementById('mock-refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      if (metrics.applications) {
        metrics.applications.textContent = String(Number(metrics.applications.textContent) + 1);
      }
      if (metrics.offers) {
        metrics.offers.textContent = String(Number(metrics.offers.textContent) + 1);
      }
      if (metrics.spontaneous) {
        metrics.spontaneous.textContent = String(Number(metrics.spontaneous.textContent) + 1);
      }
      if (metrics.hired) {
        metrics.hired.textContent = String(Number(metrics.hired.textContent) + 1);
      }
      showToast('Vue rafraîchie avec des chiffres simulés.');
    });
  }
}

function wireOffers() {
  const offerTable = document.getElementById('offers-table');
  const offerNameInput = document.getElementById('offer-name');
  const offerStatusSelect = document.getElementById('offer-status');
  const addSampleButton = document.getElementById('offer-add-sample');
  const saveButton = document.getElementById('offer-save');
  const createButton = document.getElementById('offer-create');
  const copyUrlButton = document.getElementById('offer-copy-url');

  const addRow = (title, status) => {
    if (!offerTable) {
      return;
    }

    const row = createOfferRow(title, status);
    if (row) {
      offerTable.prepend(row);
    }
  };

  if (addSampleButton) {
    addSampleButton.addEventListener('click', () => {
      const sample = ['Responsable QA', 'Designer UI', 'Développeur Back-end', 'Chargé de recrutement'];
      const selectedTitle = sample[Math.floor(Math.random() * sample.length)];
      addRow(selectedTitle, offerStatusSelect?.value || 'Publiée');
      showToast('Offre test ajoutée.');
    });
  }

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const title = offerNameInput?.value.trim() || '';
      if (!title) {
        showToast("Ajoute d'abord un nom d'offre.");
        return;
      }

      addRow(title, offerStatusSelect?.value || 'Publiée');
      if (offerNameInput) {
        offerNameInput.value = '';
      }
      showToast('Nouvelle offre enregistrée.');
    });
  }

  if (createButton) {
    createButton.addEventListener('click', () => {
      offerNameInput?.focus();
      showToast('Prêt à créer une nouvelle offre.');
    });
  }

  if (copyUrlButton) {
    copyUrlButton.addEventListener('click', () => {
      const url = 'postuler.html';
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      showToast('URL publique copiée.');
    });
  }

  document.querySelectorAll('[data-copy-link]').forEach((button) => {
    button.addEventListener('click', () => {
      const slug = button.dataset.copyLink || '';
      const url = `postuler.html?offre=${encodeURIComponent(slug)}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
      }
      showToast(`Lien prêt pour ${slug}`);
    });
  });
}

function wireApplications() {
  const sourceSelector = document.getElementById('application-source');
  const sendButton = document.getElementById('application-send');
  const previewButton = document.getElementById('application-preview');
  const relatedOffer = document.getElementById('related-offer');
  const desiredPosition = document.getElementById('desired-position');
  const spontaneousCounter = document.getElementById('spontaneous-counter');
  const spontaneousDomain = document.getElementById('spontaneous-domain');
  const nameInput = document.getElementById('application-name');
  const emailInput = document.getElementById('application-email');
  const phoneInput = document.getElementById('application-phone');

  document.querySelectorAll('.choice-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.choice-card').forEach((item) => item.classList.remove('active'));
      card.classList.add('active');
      showToast('Source sélectionnée.');
    });
  });

  if (sourceSelector) {
    sourceSelector.addEventListener('change', () => {
      const spontaneousMode = sourceSelector.value === 'spontaneous';
      if (relatedOffer) {
        relatedOffer.disabled = spontaneousMode;
      }
      if (desiredPosition) {
        desiredPosition.disabled = !spontaneousMode;
      }
      if (spontaneousDomain) {
        spontaneousDomain.disabled = !spontaneousMode;
      }
      showToast(sourceSelector.value === 'spontaneous' ? 'Mode candidature spontanée.' : 'Mode candidature sur offre.');
    });
  }

  if (sourceSelector && desiredPosition) {
    desiredPosition.disabled = sourceSelector.value !== 'spontaneous';
  }

  if (sourceSelector && relatedOffer) {
    relatedOffer.disabled = sourceSelector.value === 'spontaneous';
  }

  if (spontaneousDomain) {
    spontaneousDomain.disabled = sourceSelector?.value !== 'spontaneous';
  }

  if (sendButton && sourceSelector) {
    sendButton.addEventListener('click', () => {
      if (!nameInput?.value.trim() || !emailInput?.value.trim() || !phoneInput?.value.trim()) {
        showToast('Nom, email et telephone sont obligatoires.');
        return;
      }
      if (sourceSelector.value === 'spontaneous' && (!desiredPosition?.value || !document.querySelector('textarea')?.value.trim())) {
        showToast('Poste souhaite et message sont obligatoires en spontanee.');
        return;
      }
      if (sourceSelector.value === 'spontaneous' && spontaneousCounter) {
        spontaneousCounter.textContent = String(Number(spontaneousCounter.textContent) + 1);
      }
      showToast('Candidature recue : accuse de reception simule.');
    });
  }

  if (previewButton) {
    previewButton.addEventListener('click', () => showToast("Prévisualisation de l'accusé prête."));
  }
}

function wireCandidateManagement() {
  const search = document.getElementById('candidate-search');
  const reset = document.getElementById('candidate-reset');
  const typeFilter = document.getElementById('filter-type');
  const statusFilter = document.getElementById('filter-status');
  const offerFilter = document.getElementById('filter-offer');
  const dateFilter = document.getElementById('filter-date');
  const vivierSwitch = document.getElementById('vivier-switch');
  const directionSelect = document.getElementById('direction-select');
  const directionOption = document.getElementById('direction-option-select');
  const competenceSearch = document.getElementById('competence-search');

  const notifyFilter = () => showToast('Filtres appliqués (mode démo).');

  [typeFilter, statusFilter, offerFilter, dateFilter].forEach((field) => {
    if (!field) {
      return;
    }
    field.addEventListener('change', notifyFilter);
  });

  if (search) {
    search.addEventListener('input', () => {
      if (search.value.length > 2) {
        showToast(`Recherche: ${search.value}`);
      }
    });
  }

  if (reset) {
    reset.addEventListener('click', () => {
      if (search) search.value = '';
      if (typeFilter) typeFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      if (offerFilter) offerFilter.value = 'all';
      if (dateFilter) dateFilter.value = '';
      showToast('Filtres réinitialisés.');
    });
  }

  if (vivierSwitch) {
    vivierSwitch.addEventListener('click', () => showToast('Affichage vivier activé (simulation).'));
  }

  if (directionSelect) {
    directionSelect.addEventListener('change', () => showToast(`Direction: ${directionSelect.value}`));
  }

  if (directionOption) {
    directionOption.addEventListener('change', () => showToast(`Option: ${directionOption.value}`));
  }

  if (competenceSearch) {
    competenceSearch.addEventListener('input', () => {
      if (competenceSearch.value.length > 2) {
        showToast(`Matching sur competence: ${competenceSearch.value}`);
      }
    });
  }
}

function wireCandidateProfile() {
  const profileName = document.getElementById('profile-name');
  const profileNameHeader = document.getElementById('profile-name-header');
  const profileNameCard = document.getElementById('profile-name-card');
  const profileEmail = document.getElementById('profile-email');
  const profileSummary = document.getElementById('profile-summary');
  const profileCurrentStatus = document.getElementById('profile-current-status');
  const profileStatusPill = document.getElementById('profile-status-pill');
  const profileType = document.getElementById('profile-type');
  const profileDate = document.getElementById('profile-date');
  const profileSource = document.getElementById('profile-source');
  const profileAvatar = document.getElementById('profile-avatar');
  const profileHistory = document.getElementById('profile-history');
  const profileDoc1 = document.getElementById('profile-doc-1');
  const profileDoc2 = document.getElementById('profile-doc-2');
  const statusSelect = document.getElementById('profile-status-select');
  const updateStatus = document.getElementById('profile-status-update');
  const saveStatus = document.getElementById('profile-save-status');

  const candidates = {
    sophie: {
      name: 'Sophie Martin',
      email: 's.martin@email.com',
      summary: 'Candidate sur offre Developpeur Frontend, dossier complet avec portfolio.',
      status: 'Présélectionnée',
      statusClass: 'open',
      type: 'Sur offre',
      date: '13/08/2026',
      source: 'Formulaire web',
      avatar: 'SM',
      history: ['13/08 - Reçue', '14/08 - Présélectionnée', '17/08 - Test', '21/08 - Entretien', '25/08 - Retenue'],
      docs: ['CV_Sophie_Martin.pdf', 'Lettre_Motivation.pdf'],
    },
    karim: {
      name: 'Karim Diallo',
      email: 'k.diallo@email.com',
      summary: 'Candidat IT Support avec test en attente de planification.',
      status: 'Planifier test',
      statusClass: 'pending',
      type: 'Sur offre',
      date: '14/08/2026',
      source: 'API externe',
      avatar: 'KD',
      history: ['14/08 - Reçue', '15/08 - Présélectionnée', '18/08 - Planifier test'],
      docs: ['CV_Karim_Diallo.pdf', 'Certificat_ITIL.pdf'],
    },
    nadia: {
      name: 'Nadia Benali',
      email: 'n.benali@email.com',
      summary: 'Candidature spontanee orientee marketing CRM, conservee pour le vivier.',
      status: 'Vivier',
      statusClass: 'draft',
      type: 'Spontanée',
      date: '11/08/2026',
      source: 'Formulaire spontané',
      avatar: 'NB',
      history: ['11/08 - Reçue', '12/08 - Présélectionnée', '14/08 - Non retenue', '15/08 - Vivier'],
      docs: ['CV_Nadia_Benali.pdf', 'Portfolio_Marketing.pdf'],
    },
  };

  const params = new URLSearchParams(window.location.search);
  const key = params.get('candidat') || 'sophie';
  const candidate = candidates[key] || candidates.sophie;

  if (profileName) profileName.textContent = candidate.name;
  if (profileNameHeader) profileNameHeader.textContent = candidate.name;
  if (profileNameCard) profileNameCard.textContent = candidate.name;
  if (profileEmail) profileEmail.textContent = candidate.email;
  if (profileSummary) profileSummary.textContent = candidate.summary;
  if (profileCurrentStatus) profileCurrentStatus.textContent = candidate.status;
  if (profileType) profileType.textContent = candidate.type;
  if (profileDate) profileDate.textContent = candidate.date;
  if (profileSource) profileSource.textContent = candidate.source;
  if (profileAvatar) profileAvatar.textContent = candidate.avatar;
  if (profileDoc1) profileDoc1.textContent = candidate.docs[0];
  if (profileDoc2) profileDoc2.textContent = candidate.docs[1];

  if (profileStatusPill) {
    profileStatusPill.textContent = `Statut: ${candidate.status}`;
    profileStatusPill.className = `status ${candidate.statusClass}`;
  }

  if (profileHistory) {
    profileHistory.innerHTML = candidate.history.map((entry) => `<li><strong>${entry.slice(0, 5)}</strong> - ${entry.slice(8)}</li>`).join('');
  }

  const statusLabels = {
    recu: 'Reçue',
    preselection: 'Présélectionnée',
    test: 'Planifier test',
    entretien: 'Planifier entretien',
    retenue: 'Retenue',
    'non-retenue': 'Non retenue',
    vivier: 'Vivier',
  };

  const applyStatusChange = () => {
    if (!statusSelect || !profileCurrentStatus || !profileStatusPill) {
      return;
    }
    const label = statusLabels[statusSelect.value] || statusSelect.value;
    profileCurrentStatus.textContent = label;
    profileStatusPill.textContent = `Statut: ${label}`;
    showToast(`Statut changé vers: ${label}`);
  };

  if (updateStatus) {
    updateStatus.addEventListener('click', applyStatusChange);
  }

  if (saveStatus) {
    saveStatus.addEventListener('click', () => {
      applyStatusChange();
      showToast('Fiche candidat mise à jour (simulation).');
    });
  }
}

function wireCommunication() {
  const preview = document.getElementById('communication-preview');
  const sendButton = document.getElementById('communication-send');

  const templates = {
    receipt: "Bonjour,\n\nNous confirmons la bonne réception de votre candidature.\nNotre équipe revient vers vous rapidement.\n\nCordialement,\nL'équipe recrutement",
    test: "Bonjour,\n\nVous êtes convoqué(e) à un test le jeudi 14 août à 09h00.\nMerci de confirmer votre disponibilité.\n\nCordialement,\nL'équipe recrutement",
    interview: "Bonjour,\n\nNous vous invitons à un entretien le vendredi 15 août à 10h30.\nLe rendez-vous aura lieu en visioconférence.\n\nCordialement,\nL'équipe recrutement",
    info: "Bonjour,\n\nMerci de nous transmettre votre CV à jour et toute pièce complémentaire utile.\n\nCordialement,\nL'équipe recrutement",
    result: "Bonjour,\n\nNous reviendrons vers vous sous peu concernant la suite du recrutement.\n\nCordialement,\nL'équipe recrutement",
  };

  document.querySelectorAll('[data-template]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-template]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const templateName = button.dataset.template;
      if (preview && templateName && templates[templateName]) {
        preview.value = templates[templateName];
      }
      showToast('Modèle chargé.');
    });
  });

  if (sendButton) {
    sendButton.addEventListener('click', () => showToast('Message prêt à être envoyé.'));
  }
}

function wireSettings() {
  const saveButton = document.getElementById('settings-save');
  if (saveButton) {
    saveButton.addEventListener('click', () => showToast('Paramètres enregistrés.'));
  }
}

function wirePublicApplication() {
  const modeButtons = document.querySelectorAll('[data-mode]');
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      modeButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      showToast(button.dataset.mode === 'spontaneous' ? 'Mode spontané activé.' : 'Mode offre activé.');
    });
  });
}

function removeTableRow(button) {
  const row = button.closest('tr');
  if (row) {
    row.remove();
  }
}

function wirePrototypeActions() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'approve-extraction' || action === 'validate-domain') {
        removeTableRow(button);
        const counter = document.getElementById(action === 'validate-domain' ? 'pending-domains' : 'validation-count');
        if (counter) counter.textContent = String(Math.max(0, Number(counter.textContent) - 1));
        showToast(action === 'validate-domain' ? 'Domaine valide et rattache.' : 'Extraction validee et ajoutee au profil.');
        return;
      }

      if (action === 'reject-extraction' || action === 'reject-domain') {
        removeTableRow(button);
        showToast(action === 'reject-domain' ? 'Proposition rejetee.' : 'Extraction rejetee.');
        return;
      }

      if (action === 'edit-extraction' || action === 'edit-skill' || action === 'edit-offer') {
        showToast('Mode edition active : les champs sont modifiables.');
        return;
      }

      if (action === 'publish-offer') {
        const status = document.getElementById('offer-detail-status');
        if (status) status.textContent = 'Publiee';
        showToast("L'offre est maintenant candidatable.");
        return;
      }

      if (action === 'close-offer') {
        const status = document.getElementById('offer-detail-status');
        if (status) status.textContent = 'Cloturee';
        showToast('Offre cloturee : aucun nouveau depot accepte.');
        return;
      }

      if (action === 'add-skill' || action === 'new-skill' || action === 'add-alias') {
        showToast('Formulaire de competence pret a etre complete.');
        return;
      }

      if (action === 'new-template' || action === 'edit-template') {
        showToast(action === 'new-template' ? 'Nouveau modele pret a etre configure.' : 'Modele editable sans modifier le modele original.');
        return;
      }

      if (action === 'run-matching') {
        const result = document.getElementById('matching-result');
        if (result) result.innerHTML = '<p><strong>3 profils trouves</strong> : Sophie Martin 92%, Lea Gourdin 84%, Karim Diallo 71%.</p>';
        showToast('Matching calcule sur les competences validees.');
        return;
      }

      if (action === 'contact-vivier' || action === 'remove-vivier') {
        if (action === 'remove-vivier') removeTableRow(button);
        showToast(action === 'contact-vivier' ? 'Communication prete pour ce profil.' : 'Candidat retire du vivier.');
        return;
      }

      if (action === 'sync-domains') {
        showToast('Synchronisation simulee : 14 domaines valides disponibles.');
        return;
      }

      if (action === 'new-domain') {
        const table = document.getElementById('domain-table');
        if (table) {
          table.insertAdjacentHTML('afterbegin', '<tr><td><input value="Nouveau domaine" /></td><td><select><option>Autre</option><option>Digital</option></select></td><td>Ajout RH</td><td>Aujourd’hui</td><td><span class="status pending">En attente</span></td><td><button class="link-btn" data-action="validate-domain">Valider</button></td></tr>');
          wirePrototypeActions();
        }
        showToast('Nouveau domaine ajoute a la file.');
        return;
      }

      if (action === 'validate-all') {
        document.querySelectorAll('#validation-table tr').forEach((row) => row.remove());
        const counter = document.getElementById('validation-count');
        if (counter) counter.textContent = '0';
        showToast('Toutes les extractions visibles sont validees.');
        return;
      }

      if (action === 'export-vivier') {
        showToast('Export CSV simule genere.');
      }
    });
  });
}

setActiveNavigation();

if (page === 'dashboard') {
  wireDashboard();
}

if (page === 'offers') {
  wireOffers();
}

if (page === 'applications') {
  wireApplications();
}

if (page === 'communication') {
  wireCommunication();
}

if (page === 'settings') {
  wireSettings();
}

if (page === 'public-application') {
  wirePublicApplication();
}

if (page === 'candidate-management') {
  wireCandidateManagement();
}

if (page === 'candidate-profile') {
  wireCandidateProfile();
}

wirePrototypeActions();

showToast('Prototype prêt à explorer.');

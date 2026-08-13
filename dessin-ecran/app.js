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

  document.querySelectorAll('.choice-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.choice-card').forEach((item) => item.classList.remove('active'));
      card.classList.add('active');
      showToast('Source sélectionnée.');
    });
  });

  if (sourceSelector) {
    sourceSelector.addEventListener('change', () => {
      showToast(sourceSelector.value === 'spontaneous' ? 'Mode candidature spontanée.' : 'Mode candidature sur offre.');
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', () => showToast('Candidature simulée comme envoyée.'));
  }

  if (previewButton) {
    previewButton.addEventListener('click', () => showToast("Prévisualisation de l'accusé prête."));
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

showToast('Prototype prêt à explorer.');

# 📘 Guide Pas-à-Pas : Configuration Microsoft 365 (Outlook) & Azure Entra ID pour n8n

Ce guide détaille toutes les étapes pour connecter votre instance **n8n** à une boîte de réception **Microsoft 365 / Outlook** via **Microsoft Entra ID (anciennement Azure Active Directory)** et **Microsoft Graph API**.

---

## 🎯 Objectif
Permettre à n8n de :
1. Écouter ou lire les e-mails reçus sur l'adresse de recrutement (ex: `recrutement@alpaciment.mg`).
2. Récupérer le contenu du message et les pièces jointes (CV en PDF/Word).
3. Marquer le message comme lu ou le déplacer dans un dossier "Traité" après ingestion.
4. Envoyer éventuellement des e-mails d'accusé de réception.

---

## 📋 Prérequis
- Un compte **Microsoft 365** (compte professionnel AlpA Ciment ou compte personnel Microsoft / Outlook.com).
- Accès au portail **Microsoft Entra ID / Azure** ([https://entra.microsoft.com](https://entra.microsoft.com) ou [https://portal.azure.com](https://portal.azure.com)).
- Votre instance **n8n** en cours d'exécution (ex: `http://localhost:5678`).

---

## 🚀 Étape 1 : Récupérer l'URL de Callback dans n8n

1. Ouvrez votre interface **n8n** (ex: `http://localhost:5678`).
2. Dans le menu de gauche, cliquez sur **Credentials** (Identifiants) > **Add Credential**.
3. Recherchez **Microsoft Outlook OAuth2 API**.
4. Dans la fenêtre qui s'ouvre, repérez le champ :
   - **OAuth Callback URL** (ex: `http://localhost:5678/rest/oauth2-credential/callback`).
5. **Copiez cette URL**, vous allez devoir la coller exactement à l'identique dans Azure.
6. Ne fermez pas cette page n8n.

---

## ☁️ Étape 2 : Inscription de l'Application sur Microsoft Entra ID (Azure)

1. Connectez-vous sur le [Portail Microsoft Entra admin center](https://entra.microsoft.com) ou le [Portail Azure](https://portal.azure.com).
2. Dans le menu de gauche, déployez **Applications** puis cliquez sur **Inscriptions d'applications** (*App registrations*).
3. Cliquez sur **+ Nouvelle inscription** (*+ New registration*).
4. Remplissez les champs :
   - **Nom** : `n8n-alpaciment-recrutement` (ou le nom de votre choix).
   - **Types de comptes pris en charge** (*Supported account types*) :
     - *Si vous utilisez un compte professionnel d'entreprise (tenant unique)* : Choisissez **Comptes dans cet annuaire organisationnel uniquement (Locataire unique / Single tenant)**.
     - *Si vous utilisez un compte Outlook personnel (@outlook.com, @hotmail.com) ou multi-organisations* : Choisissez **Comptes dans n'importe quel annuaire organisationnel et comptes personnels Microsoft**.
   - **URI de redirection** (*Redirect URI*) :
     - Sélectionnez la plateforme : **Web** (⚠️ Attention : choisissez bien "Web" et **PAS** "Application monopage / SPA").
     - Collez l'URL de callback copiée depuis n8n (ex: `http://localhost:5678/rest/oauth2-credential/callback`).
5. Cliquez sur **Inscrire** (*Register*) en bas.

---

## 🔑 Étape 3 : Récupérer les Identifiants (IDs)

Une fois l'application créée, vous arrivez sur sa page **Vue d'ensemble** (*Overview*) :

1. **ID d'application (client)** (*Application (client) ID*) :
   - Copiez cette valeur UUID (ex: `12345678-abcd-1234-abcd-1234567890ab`).
2. **ID de l'annuaire (locataire)** (*Directory (tenant) ID*) :
   - Copiez également cette valeur si vous êtes en Single-Tenant.

---

## 🔒 Étape 4 : Créer le Secret Client (*Client Secret*)

1. Dans le menu de gauche de votre application Azure, cliquez sur **Certificats & secrets** (*Certificates & secrets*).
2. Sous l'onglet **Secrets client**, cliquez sur **+ Nouveau secret client** (*+ New client secret*).
3. Donnez une description : `Secret n8n Recrutement`.
4. Choisissez une expiration (ex: 180 jours ou 24 mois).
5. Cliquez sur **Ajouter** (*Add*).
6. ⚠️ **TRÈS IMPORTANT** :
   - Copiez immédiatement la colonne **Valeur** (*Value*) du secret.
   - ❌ *Ne copiez PAS l'ID du secret*, copiez bien la **Valeur**.
   - Cette valeur ne sera plus jamais affichée une fois que vous quitterez la page.

---

## 🛡️ Étape 5 : Configurer les Permissions API (Microsoft Graph)

1. Dans le menu de gauche de votre application, cliquez sur **Autorisations d'API** (*API permissions*).
2. Vous verrez déjà la permission par défaut `User.Read`.
3. Cliquez sur **+ Ajouter une autorisation** (*+ Add a permission*).
4. Choisissez **Microsoft Graph**.
5. Cliquez sur **Autorisations déléguées** (*Delegated permissions*) :
   - Recherchez et cochez les autorisations suivantes :
     - `Mail.Read` : Lire les e-mails.
     - `Mail.ReadWrite` : Lire, marquer comme lu (`isRead`) et déplacer/archiver les e-mails.
     - `Mail.Send` : (Optionnel) Envoyer les accusés de réception directement depuis la boîte mail.
     - `offline_access` : (Indispensable) Permet à n8n de rafraîchir automatiquement le token sans déconnexion.
6. Cliquez sur **Ajouter des autorisations** en bas.
7. *(Si vous êtes Administrateur de l'organisation)* :
   - Cliquez sur **Accorder le consentement administrateur pour [Organisation]** (*Grant admin consent*). Cela valide définitivement les droits sans écran de confirmation répété.

---

## 🔌 Étape 6 : Finaliser la Connexion dans n8n

1. Retournez dans votre fenêtre n8n sur la configuration du credential **Microsoft Outlook OAuth2 API**.
2. Remplissez les champs :
   - **Client ID** : Collez l'ID d'application copié à l'étape 3.
   - **Client Secret** : Collez la Valeur du secret copiée à l'étape 4.
   - **Scope** : Laisser les valeurs par défaut (ou vérifier qu'il contient `openid email profile offline_access Mail.Read Mail.ReadWrite`).
   - Si un champ **Tenant ID / Environment** apparaît :
     - Si Single-Tenant : collez votre Tenant ID.
     - Si Multi-Tenant ou compte personnel : laissez `common`.
3. Cliquez sur le bouton orange **Sign in with Microsoft** / **Connect my account**.
4. Une fenêtre popup Microsoft s'ouvre :
   - Connectez-vous avec l'adresse mail RH / recrutement.
   - Acceptez la demande d'autorisations.
5. Une fois validé, la fenêtre se ferme et n8n affiche le statut vert : **Account connected!** 🎉
6. Cliquez sur **Save** pour enregistrer votre identifiant.

---

## 🛠️ Étape 7 : Tester avec le Nœud Microsoft Outlook dans un Workflow

1. Dans votre workflow n8n, ajoutez un nœud **Microsoft Outlook**.
2. Sélectionnez le Credential que vous venez de créer.
3. **Tester la récupération des e-mails** :
   - **Resource** : `Message`
   - **Operation** : `Get Many`
   - **Limit** : `5`
   - **Filters** : `isRead eq false` (pour ne lire que les non lus).
4. Cliquez sur **Test step** :
   - Vous devez voir apparaître la liste des derniers e-mails avec leur expéditeur, sujet et `id` !

---

## ⚠️ Pièges Fréquents et Solutions

| Problème rencontré | Cause | Solution |
| :--- | :--- | :--- |
| **Erreur `redirect_uri_mismatch`** | L'URL dans Azure ne correspond pas exactement à celle de n8n. | Vérifiez les `http` vs `https`, le port `:5678`, et l'absence de slash `/` en trop à la fin. |
| **Erreur de type d'application** | La redirection a été configurée en "SPA" ou "Desktop". | Dans Azure > *Authentification*, supprimez la plateforme et recréez-la obligatoirement en **Web**. |
| **Le token expire au bout d'une heure** | La permission `offline_access` est absente. | Ajoutez la permission déléguée `offline_access` dans Microsoft Graph pour obtenir le Refresh Token. |
| **Invalid Client Secret** | Vous avez copié le *Secret ID* au lieu de la *Value*. | Recréez un nouveau secret client et copiez bien la colonne **Valeur**. |

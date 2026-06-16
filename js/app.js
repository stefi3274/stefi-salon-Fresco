// ── Config ───────────────────────────────────────────────────────
const ENTREPRISE_ID = 'cc0bec95-bcf1-46ac-a364-dc63bb22a2e5';
const TOTAL_INVESTI = 1310;
const PCT_STEFI     = 0.50;
const PCT_NATAILA   = 0.50;
const ADMIN_PIN     = '1379';

// ── State ────────────────────────────────────────────────────────
let depenses = [];
let recettes = [];
let modalCallback = null;
let isAdmin = false;

// ── Formatage ────────────────────────────────────────────────────
const fmt = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};
const pct = (a, b) => b === 0 ? 0 : Math.min(100, (a / b) * 100);

// ── Init ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Date par défaut
  const dateInput = document.getElementById('rec-date');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

  // Nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Vérifier session admin
  if (sessionStorage.getItem('admin') === ADMIN_PIN) {
    isAdmin = true;
  }
  updateAdminUI();

  // Splash
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('splash').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
    }, 500);
  }, 1200);

  await chargerDonnees();
});

// ── Admin ─────────────────────────────────────────────────────────
function showPinModal() {
  document.getElementById('pin-modal').classList.remove('hidden');
  document.getElementById('pin-input').value = '';
  setTimeout(() => document.getElementById('pin-input').focus(), 100);
}

function closePinModal() {
  document.getElementById('pin-modal').classList.add('hidden');
}

function verifierPin() {
  const val = document.getElementById('pin-input').value.trim();
  if (val === ADMIN_PIN) {
    isAdmin = true;
    sessionStorage.setItem('admin', ADMIN_PIN);
    closePinModal();
    updateAdminUI();
    toast('🔓 Mode admin activé');
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
    document.getElementById('pin-input').value = '';
  }
}

function deconnecterAdmin() {
  isAdmin = false;
  sessionStorage.removeItem('admin');
  updateAdminUI();
  toast('🔒 Déconnecté');
}

function updateAdminUI() {
  // Boutons admin (ajouter/supprimer)
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  // Bouton login/logout header
  const loginBtn  = document.getElementById('btn-login');
  const logoutBtn = document.getElementById('btn-logout');
  if (loginBtn)  loginBtn.style.display  = isAdmin ? 'none' : '';
  if (logoutBtn) logoutBtn.style.display = isAdmin ? '' : 'none';
}

// ── Navigation ───────────────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabId)?.classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
}

// ── Données ──────────────────────────────────────────────────────
async function chargerDonnees() {
  setSyncing(true);
  try {
    const [deps, recs] = await Promise.all([
      db.select('depenses', `entreprise_id=eq.${ENTREPRISE_ID}`),
      db.select('recettes', `entreprise_id=eq.${ENTREPRISE_ID}`),
    ]);
    depenses = deps;
    recettes = recs;
    rafraichir();
  } catch (e) {
    toast('❌ Erreur de connexion');
  }
  setSyncing(false);
}

function rafraichir() {
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant), 0);
  const totalRec = recettes.reduce((s, r) => s + Number(r.montant), 0);
  const benefice = totalRec - totalDep;
  const reste    = Math.max(0, totalDep - totalRec);
  const colorBen = benefice >= 0 ? '#16A34A' : '#DC2626';

  // ── Dashboard ─────────────────────────────────────────────────
  set('db-benefice',     fmt(benefice), colorBen);
  set('db-recettes',     fmt(totalRec));
  set('db-depenses',     fmt(totalDep));
  set('db-investi',      fmt(TOTAL_INVESTI));
  set('db-reste',        fmt(reste));
  set('db-recupere-txt', fmt(totalRec) + ' récupéré');
  set('db-recupere-pct', pct(totalRec, totalDep).toFixed(1) + '%');
  set('db-objectif',     fmt(totalDep));
  const prog = document.getElementById('db-progress');
  if (prog) prog.style.width = pct(totalRec, totalDep).toFixed(1) + '%';

  const recEl = document.getElementById('db-dernieres-recettes');
  if (recEl) {
    if (recettes.length === 0) {
      recEl.innerHTML = '<div class="empty">Aucune recette encore.</div>';
    } else {
      recEl.innerHTML = [...recettes].reverse().slice(0, 3).map(r => `
        <div class="list-item">
          <div>
            <div class="list-label">${r.label}</div>
            <div class="list-date">${fmtDate(r.created_at)}</div>
          </div>
          <div class="amount green">+${fmt(r.montant)}</div>
        </div>`).join('');
    }
  }

  // ── Dépenses ──────────────────────────────────────────────────
  set('dep-total', fmt(totalDep));
  const depList = document.getElementById('dep-list');
  if (depList) {
    if (depenses.length === 0) {
      depList.innerHTML = '<div class="empty">Aucune dépense enregistrée.</div>';
    } else {
      depList.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Description</th><th>Date & Heure</th><th>Montant</th><th class="admin-only"></th></tr>
          </thead>
          <tbody>
            ${depenses.map((d, i) => `
              <tr>
                <td class="num-col">${i + 1}</td>
                <td>${d.label}</td>
                <td class="date-col">${fmtDate(d.created_at)}</td>
                <td class="amount red">${fmt(d.montant)}</td>
                <td class="admin-only">
                  <button class="btn btn-sm btn-del" onclick="confirmerSupp('dep','${d.id}')">✕</button>
                </td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="3"><strong>TOTAL</strong></td><td class="amount red"><strong>${fmt(totalDep)}</strong></td><td></td></tr>
          </tfoot>
        </table>`;
    }
  }

  // ── Recettes ──────────────────────────────────────────────────
  set('rec-total', fmt(totalRec));
  const recList = document.getElementById('rec-list');
  if (recList) {
    if (recettes.length === 0) {
      recList.innerHTML = '<div class="empty">Aucune recette enregistrée.</div>';
    } else {
      recList.innerHTML = `
        <table class="data-table">
          <thead>
            <tr><th>#</th><th>Description</th><th>Date & Heure</th><th>Montant</th><th class="admin-only"></th></tr>
          </thead>
          <tbody>
            ${[...recettes].reverse().map((r, i) => `
              <tr>
                <td class="num-col">${i + 1}</td>
                <td>${r.label}</td>
                <td class="date-col">${fmtDate(r.created_at)}</td>
                <td class="amount green">+${fmt(r.montant)}</td>
                <td class="admin-only">
                  <button class="btn btn-sm btn-del" onclick="confirmerSupp('rec','${r.id}')">✕</button>
                </td>
              </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr><td colspan="3"><strong>TOTAL</strong></td><td class="amount green"><strong>+${fmt(totalRec)}</strong></td><td></td></tr>
          </tfoot>
        </table>`;
    }
  }

  // ── Répartition ───────────────────────────────────────────────
  const partStefi   = benefice > 0 ? benefice * PCT_STEFI   : 0;
  const partNataila = benefice > 0 ? benefice * PCT_NATAILA : 0;

  const alertNeg = document.getElementById('rep-alert-neg');
  const alertPos = document.getElementById('rep-alert-pos');
  if (benefice <= 0) {
    alertNeg?.classList.remove('hidden');
    alertPos?.classList.add('hidden');
    const el = document.getElementById('rep-reste-txt');
    if (el) el.textContent = `Il reste ${fmt(Math.abs(benefice))} à récupérer avant d'être en bénéfice.`;
  } else {
    alertNeg?.classList.add('hidden');
    alertPos?.classList.remove('hidden');
    set('rep-benefice', fmt(benefice));
  }

  const repTable = document.getElementById('rep-table');
  if (repTable) {
    repTable.innerHTML = `
      <div class="card">
        <table class="data-table">
          <thead>
            <tr><th>Associé</th><th>Part</th><th>Cash investi</th><th>Bénéfice</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>👫 Steve & Figeline</td>
              <td><span class="badge badge-blue">50%</span></td>
              <td class="amount blue">$410.00</td>
              <td class="amount ${benefice > 0 ? 'green' : ''}">${fmt(partStefi)}</td>
            </tr>
            <tr>
              <td>👩 Nataïla</td>
              <td><span class="badge badge-green">50%</span></td>
              <td class="amount green">$900.00</td>
              <td class="amount ${benefice > 0 ? 'green' : ''}">${fmt(partNataila)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><strong>Bénéfice net total</strong></td>
              <td class="amount" style="color:${colorBen}"><strong>${fmt(benefice)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>`;
  }

  set('rep-investi',  fmt(TOTAL_INVESTI));
  set('rep-depenses', fmt(totalDep));
  set('rep-recettes', fmt(totalRec));
  set('rep-net',      fmt(benefice), colorBen);

  // Refresh admin UI après rendu
  updateAdminUI();
}

// ── Ajouter dépense ──────────────────────────────────────────────
async function ajouterDepense() {
  if (!isAdmin) { showPinModal(); return; }
  const label   = document.getElementById('dep-label')?.value.trim();
  const montant = parseFloat(document.getElementById('dep-montant')?.value);
  if (!label || isNaN(montant) || montant <= 0) { toast('⚠️ Remplis tous les champs'); return; }

  setSyncing(true);
  try {
    const res = await db.insert('depenses', { entreprise_id: ENTREPRISE_ID, label, montant });
    depenses.push(res[0] || { id: Date.now(), label, montant, created_at: new Date().toISOString() });
    document.getElementById('dep-label').value   = '';
    document.getElementById('dep-montant').value = '';
    toggleForm('form-depense');
    rafraichir();
    toast('✅ Dépense ajoutée');
  } catch (e) { toast('❌ Erreur : ' + e.message); }
  setSyncing(false);
}

// ── Ajouter recette ──────────────────────────────────────────────
async function ajouterRecette() {
  if (!isAdmin) { showPinModal(); return; }
  const label   = document.getElementById('rec-label')?.value.trim();
  const montant = parseFloat(document.getElementById('rec-montant')?.value);
  const date    = document.getElementById('rec-date')?.value;
  if (!label || isNaN(montant) || montant <= 0) { toast('⚠️ Remplis tous les champs'); return; }

  setSyncing(true);
  try {
    const res = await db.insert('recettes', { entreprise_id: ENTREPRISE_ID, label, montant, date });
    recettes.push(res[0] || { id: Date.now(), label, montant, date, created_at: new Date().toISOString() });
    document.getElementById('rec-label').value   = '';
    document.getElementById('rec-montant').value = '';
    toggleForm('form-recette');
    rafraichir();
    toast('✅ Recette ajoutée');
  } catch (e) { toast('❌ Erreur : ' + e.message); }
  setSyncing(false);
}

// ── Suppression ──────────────────────────────────────────────────
function confirmerSupp(type, id) {
  if (!isAdmin) { toast('🔒 Accès admin requis'); return; }
  modalCallback = async () => {
    setSyncing(true);
    try {
      await db.delete(type === 'dep' ? 'depenses' : 'recettes', id);
      if (type === 'dep') depenses = depenses.filter(d => String(d.id) !== String(id));
      else recettes = recettes.filter(r => String(r.id) !== String(id));
      rafraichir();
      toast('🗑️ Supprimé');
    } catch (e) { toast('❌ Erreur : ' + e.message); }
    setSyncing(false);
    closeModal();
  };
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('modal-confirm').onclick = modalCallback;
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  modalCallback = null;
}

// ── UI Helpers ───────────────────────────────────────────────────
function toggleForm(id) {
  if (!isAdmin) { showPinModal(); return; }
  document.getElementById(id)?.classList.toggle('hidden');
}

function setSyncing(on) {
  const el = document.getElementById('syncStatus');
  if (el) el.classList.toggle('spinning', on);
}

function set(id, text, color = null) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  if (color) el.style.color = color;
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 2800);
}

// PIN Enter key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !document.getElementById('pin-modal').classList.contains('hidden')) {
    verifierPin();
  }
});

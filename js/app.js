// ── Config ───────────────────────────────────────────────────────
const ENTREPRISE_ID = 'cc0bec95-bcf1-46ac-a364-dc63bb22a2e5';
const TOTAL_INVESTI = 1310;
const PCT_STEFI     = 0.313;
const PCT_NATAILA   = 0.687;

// ── State ────────────────────────────────────────────────────────
let depenses = [];
let recettes = [];
let modalCallback = null;

// ── Formatage ────────────────────────────────────────────────────
const fmt = (n) => '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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

  // Dashboard
  const colorBen = benefice >= 0 ? '#16A34A' : '#DC2626';
  set('db-benefice',      fmt(benefice), colorBen);
  set('db-recettes',      fmt(totalRec));
  set('db-depenses',      fmt(totalDep));
  set('db-investi',       fmt(TOTAL_INVESTI));
  set('db-reste',         fmt(reste));
  set('db-recupere-txt',  fmt(totalRec) + ' récupéré');
  set('db-recupere-pct',  pct(totalRec, totalDep).toFixed(1) + '%');
  set('db-objectif',      fmt(totalDep));
  const prog = document.getElementById('db-progress');
  if (prog) prog.style.width = pct(totalRec, totalDep).toFixed(1) + '%';

  // Dernières recettes dashboard
  const recEl = document.getElementById('db-dernières-recettes');
  if (recEl) {
    if (recettes.length === 0) {
      recEl.innerHTML = '<div class="empty">Aucune recette encore.</div>';
    } else {
      recEl.innerHTML = [...recettes].reverse().slice(0, 3).map(r => `
        <div class="list-item">
          <div>
            <div class="list-label">${r.label}</div>
            <div class="list-date">${r.date || ''}</div>
          </div>
          <div class="amount green">+${fmt(r.montant)}</div>
        </div>`).join('');
    }
  }

  // Dépenses list
  set('dep-total', fmt(totalDep));
  const depList = document.getElementById('dep-list');
  if (depList) {
    if (depenses.length === 0) {
      depList.innerHTML = '<div class="empty">Aucune dépense enregistrée.</div>';
    } else {
      depList.innerHTML = depenses.map(d => `
        <div class="list-item">
          <span class="list-label">${d.label}</span>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="amount red">${fmt(d.montant)}</span>
            <button class="btn btn-sm btn-del" onclick="confirmerSupp('dep','${d.id}')">✕</button>
          </div>
        </div>`).join('');
    }
  }

  // Recettes list
  set('rec-total', fmt(totalRec));
  const recList = document.getElementById('rec-list');
  if (recList) {
    if (recettes.length === 0) {
      recList.innerHTML = '<div class="empty">Aucune recette enregistrée.</div>';
    } else {
      recList.innerHTML = [...recettes].reverse().map(r => `
        <div class="list-item">
          <div>
            <div class="list-label">${r.label}</div>
            <div class="list-date">${r.date || ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="amount green">+${fmt(r.montant)}</span>
            <button class="btn btn-sm btn-del" onclick="confirmerSupp('rec','${r.id}')">✕</button>
          </div>
        </div>`).join('');
    }
  }

  // Répartition
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

  set('rep-part-stefi',   fmt(partStefi),   benefice > 0 ? '#16A34A' : '#94A3B8');
  set('rep-part-nataila', fmt(partNataila),  benefice > 0 ? '#16A34A' : '#94A3B8');
  set('rep-investi',  fmt(TOTAL_INVESTI));
  set('rep-depenses', fmt(totalDep));
  set('rep-recettes', fmt(totalRec));
  set('rep-net',      fmt(benefice), colorBen);
}

// ── Ajouter dépense ──────────────────────────────────────────────
async function ajouterDepense() {
  const label   = document.getElementById('dep-label')?.value.trim();
  const montant = parseFloat(document.getElementById('dep-montant')?.value);
  if (!label || isNaN(montant) || montant <= 0) { toast('⚠️ Remplis tous les champs'); return; }

  setSyncing(true);
  try {
    const res = await db.insert('depenses', { entreprise_id: ENTREPRISE_ID, label, montant });
    depenses.push(res[0] || { id: Date.now(), label, montant });
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
  const label   = document.getElementById('rec-label')?.value.trim();
  const montant = parseFloat(document.getElementById('rec-montant')?.value);
  const date    = document.getElementById('rec-date')?.value;
  if (!label || isNaN(montant) || montant <= 0) { toast('⚠️ Remplis tous les champs'); return; }

  setSyncing(true);
  try {
    const res = await db.insert('recettes', { entreprise_id: ENTREPRISE_ID, label, montant, date });
    recettes.push(res[0] || { id: Date.now(), label, montant, date });
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

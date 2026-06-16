// ── Supabase Lite Client ──────────────────────────────────────────
const SUPABASE_URL = 'https://darzhfamxnycdglcglgg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcnpoZmFteG55Y2RnbGNnbGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDUzNjcsImV4cCI6MjA5NTkyMTM2N30.uHMDHR4df8oYGIqLonLwAgEDzzdu1s7yj7VWtp3KUBQ';

const db = {
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': method === 'POST' ? 'return=representation' : '',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erreur Supabase');
    }
    return res.json().catch(() => []);
  },

  async select(table, filters = '') {
    return this.request('GET', `${table}?${filters}&order=created_at.asc`);
  },

  async insert(table, data) {
    return this.request('POST', table, data);
  },

  async delete(table, id) {
    return this.request('DELETE', `${table}?id=eq.${id}`);
  },
};

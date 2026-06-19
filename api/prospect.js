export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const dbUrl = process.env.DATABASE_URL;
  const dbKey = process.env.DATABASE_KEY;
  if (!dbUrl || !dbKey) return res.status(500).json({ error: 'Database not configured' });

  const { userId, operation, data } = req.body || {};
  if (!userId || !operation || !data) return res.status(400).json({ error: 'Missing fields' });

  const headers = {
    apikey: dbKey,
    Authorization: `Bearer ${dbKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  const base = `${dbUrl}/rest/v1/prospects`;

  async function findProspect(name) {
    const resp = await fetch(
      `${base}?user_id=eq.${encodeURIComponent(userId)}&name=ilike.${encodeURIComponent(name)}&archived=eq.false`,
      { headers }
    );
    const rows = await resp.json();
    return rows[0] || null;
  }

  try {
    if (operation === 'create') {
      const existing = await findProspect(data.name);
      if (existing) {
        const update = {
          stage: data.stage || existing.stage,
          platform: data.platform || existing.platform,
          location: data.location || existing.location,
          rating: data.rating ?? existing.rating,
          notes: data.notes || existing.notes,
          updated_at: new Date().toISOString(),
        };
        const r = await fetch(`${base}?id=eq.${existing.id}`, {
          method: 'PATCH', headers, body: JSON.stringify(update),
        });
        if (!r.ok) throw new Error(`Supabase ${r.status}`);
        return res.json({ ok: true, action: 'updated', name: data.name });
      }
      const row = {
        user_id: userId,
        name: data.name,
        stage: data.stage || 'texting',
        platform: data.platform || null,
        location: data.location || null,
        rating: data.rating || null,
        notes: data.notes || null,
        logs: [],
        archived: false,
      };
      const r = await fetch(base, { method: 'POST', headers, body: JSON.stringify(row) });
      if (!r.ok) throw new Error(`Supabase ${r.status}`);
      return res.json({ ok: true, action: 'created', name: data.name });
    }

    if (operation === 'update') {
      const existing = await findProspect(data.name);
      if (!existing) return res.status(404).json({ error: `"${data.name}" not found` });
      const update = { updated_at: new Date().toISOString() };
      if (data.stage) update.stage = data.stage;
      if (data.platform) update.platform = data.platform;
      if (data.location) update.location = data.location;
      if (data.rating != null) update.rating = data.rating;
      if (data.notes) update.notes = data.notes;
      const r = await fetch(`${base}?id=eq.${existing.id}`, {
        method: 'PATCH', headers, body: JSON.stringify(update),
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}`);
      return res.json({ ok: true, action: 'updated', name: data.name });
    }

    if (operation === 'log') {
      const existing = await findProspect(data.name);
      if (!existing) return res.status(404).json({ error: `"${data.name}" not found` });
      const entry = { date: new Date().toISOString(), text: data.log_text };
      const logs = [...(existing.logs || []), entry];
      const r = await fetch(`${base}?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ logs, updated_at: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}`);
      return res.json({ ok: true, action: 'logged', name: data.name });
    }

    if (operation === 'archive') {
      const existing = await findProspect(data.name);
      if (!existing) return res.status(404).json({ error: `"${data.name}" not found` });
      const r = await fetch(`${base}?id=eq.${existing.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          archived: true,
          archive_reason: data.archive_reason || null,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!r.ok) throw new Error(`Supabase ${r.status}`);
      return res.json({ ok: true, action: 'archived', name: data.name });
    }

    return res.status(400).json({ error: `Unknown operation: ${operation}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

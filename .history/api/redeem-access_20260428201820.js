const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ error: 'Server misconfigured' });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch (e) { body = {}; }
  const code = (body.code || '').toString().trim();
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-access-token'] || null);
  if (!token) return res.status(401).json({ error: 'Missing token' });

  // Verify token to get user info
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData || !userData.user) return res.status(401).json({ error: 'Invalid token' });
  const user = userData.user;

  // Normalize code for lookup
  const clean = code.replace(/\s+/g, '').toUpperCase();

  // Look up coupon (case-insensitive, ignoring spaces)
  const { data: coupons, error: selErr } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', clean)
    .limit(1);

  if (selErr) return res.status(500).json({ error: selErr });
  const c = (coupons && coupons[0]) || null;
  if (!c) return res.status(404).json({ success: false, message: 'Cupón no existe' });

  // If already used
  if (c.used) {
    if (c.redeemed_by === user.id && c.expires_at && new Date(c.expires_at) > new Date()) {
      const expires = c.expires_at;
      const daysLeft = Math.max(0, Math.ceil((new Date(expires) - new Date()) / 86400000));
      return res.status(200).json({ success: true, message: 'Cupón ya activo', expires_at: expires, days_left: daysLeft, code: c.code });
    }
    return res.status(400).json({ success: false, message: 'Cupón ya utilizado' });
  }

  // Compute new expiry
  const duration = (c.duration_days && Number.isFinite(Number(c.duration_days))) ? Number(c.duration_days) : 30;
  const newExpires = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();

  const { data: upd, error: updErr } = await supabase
    .from('coupons')
    .update({
      used: true,
      redeemed_by: user.id,
      redeemed_email: user.email || null,
      redeemed_at: new Date().toISOString(),
      expires_at: newExpires,
    })
    .eq('id', c.id)
    .select()
    .single();

  if (updErr) return res.status(500).json({ error: updErr });

  const daysLeft = Math.max(0, Math.ceil((new Date(newExpires) - new Date()) / 86400000));
  return res.status(200).json({ success: true, message: 'Acceso activado', expires_at: newExpires, days_left: daysLeft, code: upd.code });
};

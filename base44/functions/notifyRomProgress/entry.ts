import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Emails the signed-in user (only themselves) about range-of-motion gains.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { gains } = await req.json();
    if (!Array.isArray(gains) || !gains.length) return Response.json({ error: 'No gains' }, { status: 400 });
    const top = gains[0];
    const gain = Math.round(Number(top.gain));
    if (!(gain >= 10 && gain <= 180)) return Response.json({ error: 'Invalid gain' }, { status: 400 });
    const clean = (s) => String(s || '').replace(/[^A-Za-z ]/g, '').slice(0, 40);
    const more = Math.min(gains.length - 1, 20);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: 'Your range of motion improved!',
      body: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fff;border:1px solid #e5e7eb;border-radius:4px">
<div style="background:#111;color:#fff;padding:16px 24px;font-weight:700">InclusiveMove</div>
<div style="padding:28px 24px"><h1 style="margin:0;font-size:26px">Great progress, ${clean((user.full_name || 'there').split(' ')[0])}!</h1>
<p style="color:#6b7280">Your latest mobility check shows a significant gain in movement.</p>
<p style="font-size:20px;font-weight:700">${clean(top.hand)} ${clean(top.label)}: +${gain}°</p>
<p style="color:#6b7280">Now ${Math.round(Number(top.now)) || 0}° of movement. ${more > 0 ? `${more} more joint${more > 1 ? 's' : ''} also improved.` : ''}</p>
<a href="https://inclusive-motion-mate.base44.app/dashboard" style="display:inline-block;background:#000;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700">See your progress</a></div></div>`
    });
    return Response.json({ sent: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
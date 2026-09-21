const allowedAttendance = new Set(['yes', 'no', 'valar']);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    // Honeypot: silently accept bots without forwarding spam to the dashboard.
    if (body.website) return { statusCode: 204, body: '' };
    if (!allowedAttendance.has(body.attendance) || !body.house || !body.preference || (body.attendance === 'valar' && !body.valarComment)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid survey data' }) };
    }

    const submission = {
      attendance: String(body.attendance),
      house: String(body.house).slice(0, 80),
      preference: String(body.preference).slice(0, 160),
      valarComment: body.attendance === 'valar' ? String(body.valarComment).slice(0, 500) : null,
      submittedAt: new Date().toISOString(),
    };
    const webhookUrl = process.env.DASHBOARD_WEBHOOK_URL;
    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DASHBOARD_WEBHOOK_TOKEN || ''}` },
        body: JSON.stringify(submission),
      });
      if (!response.ok) throw new Error('dashboard_forward_failed');
    } else {
      console.info('DASHBOARD_WEBHOOK_URL is not configured', submission);
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unable to process survey' }) };
  }
};

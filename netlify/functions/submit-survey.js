const allowedAttendance = new Set(['yes', 'no', 'valar']);

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

const saveToSupabase = async (submission) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/survey_responses`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      attendance: submission.attendance,
      house: submission.house,
      preference: submission.preference,
      valar_comment: submission.valarComment,
      submitted_at: submission.submittedAt,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase insert failed: ${details}`);
  }
};

const forwardToWebhook = async (submission) => {
  const webhookUrl = process.env.DASHBOARD_WEBHOOK_URL;

  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DASHBOARD_WEBHOOK_TOKEN || ''}`,
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error('Dashboard webhook forwarding failed');
  }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: 'Method Not Allowed',
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Ignora bots que completan el campo invisible.
    if (body.website) {
      return { statusCode: 204, body: '' };
    }

    if (
      !allowedAttendance.has(body.attendance) ||
      !body.house ||
      !body.preference ||
      (body.attendance === 'valar' && !body.valarComment)
    ) {
      return json(400, {
        error: 'Invalid survey data',
      });
    }

    const submission = {
      attendance: String(body.attendance),
      house: String(body.house).slice(0, 80),
      preference: String(body.preference).slice(0, 160),
      valarComment: body.valarComment
        ? String(body.valarComment).slice(0, 500)
        : null,
      submittedAt: new Date().toISOString(),
    };

    await saveToSupabase(submission);
    await forwardToWebhook(submission);

    return json(200, { ok: true });
  } catch (error) {
    console.error('Survey submission failed:', error);

    return json(500, {
      error: 'Unable to process survey',
    });
  }
};
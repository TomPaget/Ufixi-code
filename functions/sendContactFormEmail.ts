import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { Resend } from 'npm:resend@3.4.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, issueSummary } = await req.json();

    if (!email || !issueSummary) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'info@ufixi.co.uk',
      subject: 'Support Request from Ufixi User',
      html: `<p><strong>User Email:</strong> ${email}</p><p><strong>Issue Summary:</strong></p><p>${issueSummary.replace(/\n/g, '<br>')}</p>`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
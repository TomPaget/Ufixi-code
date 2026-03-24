import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { issueId } = await req.json();
  if (!issueId) {
    return Response.json({ error: 'issueId required' }, { status: 400 });
  }

  const issues = await base44.entities.Issue.filter({ id: issueId });
  const issue = issues[0];
  if (!issue) {
    return Response.json({ error: 'Issue not found' }, { status: 404 });
  }

  const urgencyLabel = { fix_now: '🔴 Fix Now', fix_soon: '🟡 Fix Soon', ignore: '🟢 Monitor' }[issue.urgency] || issue.urgency;
  const currency = user.currency === 'USD' ? '$' : user.currency === 'EUR' ? '€' : '£';

  const diyCostRange = (issue.diy_cost_min != null && issue.diy_cost_max != null)
    ? `${currency}${issue.diy_cost_min} – ${currency}${issue.diy_cost_max}`
    : 'N/A';
  const proCostRange = (issue.pro_cost_min != null && issue.pro_cost_max != null)
    ? `${currency}${issue.pro_cost_min} – ${currency}${issue.pro_cost_max}`
    : 'N/A';

  const diyStepsHtml = issue.diy_steps?.length
    ? issue.diy_steps.map((s, i) => `<li style="margin-bottom:8px;">${i + 1}. ${s}</li>`).join('')
    : '<li>No DIY steps available.</li>';

  const productsHtml = issue.products_needed?.length
    ? issue.products_needed.map(p =>
        `<li style="margin-bottom:6px;"><strong>${p.name}</strong> — ${p.description || ''} ${p.estimatedCost ? `(~${p.estimatedCost})` : ''}</li>`
      ).join('')
    : '<li>No products listed.</li>';

  const photoSection = issue.media_url && issue.media_type === 'photo'
    ? `<p><img src="${issue.media_url}" alt="Issue photo" style="max-width:100%;border-radius:12px;margin-top:12px;" /></p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background:#FDF6EE; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#E8530A,#D93870);padding:32px 28px;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">UFixi Issue Report</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Generated ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;">
        ${photoSection}
        <h2 style="color:#00172F;font-size:20px;margin:16px 0 6px;">${issue.title}</h2>
        <p style="margin:0 0 16px;"><span style="background:${issue.urgency === 'fix_now' ? '#fee2e2' : issue.urgency === 'fix_soon' ? '#fef3c7' : '#dcfce7'};color:${issue.urgency === 'fix_now' ? '#dc2626' : issue.urgency === 'fix_soon' ? '#d97706' : '#16a34a'};padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;">${urgencyLabel}</span></p>
        
        <h3 style="color:#E8530A;font-size:15px;margin:20px 0 8px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Diagnosis</h3>
        <p style="color:#374151;line-height:1.7;margin:0 0 20px;">${issue.explanation || 'No explanation available.'}</p>

        <h3 style="color:#E8530A;font-size:15px;margin:20px 0 8px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Cost Estimates</h3>
        <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;overflow:hidden;">
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 16px;text-align:left;font-size:13px;color:#6b7280;">DIY Cost</th>
            <th style="padding:10px 16px;text-align:left;font-size:13px;color:#6b7280;">Professional Cost</th>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-weight:600;color:#00172F;">${diyCostRange}</td>
            <td style="padding:12px 16px;font-weight:600;color:#00172F;">${proCostRange}</td>
          </tr>
        </table>

        <h3 style="color:#E8530A;font-size:15px;margin:24px 0 8px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">DIY Steps</h3>
        <ol style="color:#374151;line-height:1.7;padding-left:20px;margin:0 0 20px;">${diyStepsHtml}</ol>

        <h3 style="color:#E8530A;font-size:15px;margin:20px 0 8px;border-bottom:2px solid #f3f4f6;padding-bottom:6px;">Products Needed</h3>
        <ul style="color:#374151;line-height:1.7;padding-left:20px;margin:0 0 24px;">${productsHtml}</ul>

        <p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#92400e;margin:0;">
          ⚠️ This report is for informational purposes only. Always consult a qualified professional for safety-critical repairs.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f9fafb;padding:16px 28px;text-align:center;">
        <p style="font-size:12px;color:#9ca3af;margin:0;">UFixi · AI-Powered Home Repair Diagnostics · ufxi.app</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await base44.integrations.Core.SendEmail({
    to: user.email,
    subject: `UFixi Report: ${issue.title}`,
    body: html,
    from_name: 'UFixi Reports'
  });

  return Response.json({ success: true });
});
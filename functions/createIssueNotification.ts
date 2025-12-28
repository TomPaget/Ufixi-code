import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me();

    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { issueId, userId, notificationType } = await req.json();

    if (!issueId || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authorization: Only issue owner or admin can trigger notifications
    const issues = await base44.asServiceRole.entities.Issue.filter({ id: issueId });
    if (issues.length === 0) {
      return Response.json({ error: 'Issue not found' }, { status: 404 });
    }
    
    if (issues[0].created_by !== caller.email && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Can only notify for your own issues' }, { status: 403 });
    }

    // Ensure userId matches issue owner unless admin
    if (caller.role !== 'admin' && userId !== caller.id) {
      return Response.json({ error: 'Forbidden: Can only send notifications to yourself' }, { status: 403 });
    }

    const issue = issues[0];

    // Get user details
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    let title, message, priority, actionUrl;

    switch (notificationType) {
      case 'critical_issue':
        title = `⚠️ Critical Issue Detected`;
        message = `Your issue "${issue.title}" is marked as critical (severity ${issue.severity_score}/10) and requires immediate attention.`;
        priority = 'urgent';
        actionUrl = `IssueDetail?id=${issueId}`;
        break;

      case 'fix_now_urgency':
        title = `🚨 Urgent Repair Needed`;
        message = `"${issue.title}" requires immediate repair to prevent damage or safety hazards.`;
        priority = 'urgent';
        actionUrl = `IssueDetail?id=${issueId}`;
        break;

      case 'issue_created':
        title = `✅ Issue Analysis Complete`;
        message = `Your issue "${issue.title}" has been analyzed. View the detailed repair guide and cost estimates.`;
        priority = 'normal';
        actionUrl = `IssueDetail?id=${issueId}`;
        break;

      case 'status_changed':
        title = `📝 Status Update`;
        message = `"${issue.title}" status changed to: ${issue.status?.replace('_', ' ')}`;
        priority = 'normal';
        actionUrl = `IssueDetail?id=${issueId}`;
        break;

      case 'reminder':
        title = `🔔 Maintenance Reminder`;
        message = `Don't forget to address "${issue.title}". It's been marked as "${issue.urgency}".`;
        priority = 'normal';
        actionUrl = `IssueDetail?id=${issueId}`;
        break;

      default:
        title = 'Issue Update';
        message = `Update on "${issue.title}"`;
        priority = 'normal';
        actionUrl = `IssueDetail?id=${issueId}`;
    }

    // Check user's notification preferences
    const prefs = user.notification_preferences || {};
    const shouldSendEmail = prefs.email_enabled !== false && prefs.issue_updates_enabled !== false;
    const sentVia = [];

    // Send email if enabled
    if (shouldSendEmail && user.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: title,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0F1E2E 0%, #1E3A57 100%); padding: 30px; text-align: center;">
                <h1 style="color: #F7B600; margin: 0; font-size: 32px;">QuoFix</h1>
              </div>
              <div style="padding: 30px; background: #fff;">
                <h2 style="color: #1E3A57; margin-top: 0;">${title}</h2>
                <p style="color: #333; line-height: 1.6; font-size: 16px;">${message}</p>
                ${issue.explanation ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #666; font-size: 14px;"><strong>Issue Details:</strong></p>
                  <p style="margin: 10px 0 0 0; color: #333;">${issue.explanation.substring(0, 200)}...</p>
                </div>` : ''}
                <a href="https://app.base44.com/issues/${issueId}" style="display: inline-block; background: #57CFA4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">View Issue Details</a>
              </div>
              <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0 0 10px 0;">You're receiving this because you have issue notifications enabled in QuoFix.</p>
                <p style="margin: 0;"><a href="https://app.base44.com/settings" style="color: #57CFA4; text-decoration: none;">Manage notification preferences</a></p>
              </div>
            </div>
          `
        });
        sentVia.push('email');
      } catch (error) {
        console.error('Email send error:', error);
      }
    }

    // Create in-app notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title,
      message,
      type: 'issue_update',
      priority,
      sent_via: sentVia,
      related_entity_type: 'Issue',
      related_entity_id: issueId,
      action_url: actionUrl,
      sent_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      notification,
      sent_via: sentVia
    });

  } catch (error) {
    console.error('Notification creation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
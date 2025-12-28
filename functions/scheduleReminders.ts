import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify this is an authenticated system call (cron job or admin)
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    
    // Check for cron secret
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Valid cron job call
    } else {
      // Otherwise require admin authentication
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ 
          error: 'Unauthorized: This endpoint is restricted to system cron jobs or admins' 
        }, { status: 403 });
      }
    }

    // This function would be called by a cron job (every hour or daily)
    // Check for upcoming reminders and send notifications

    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Get all active issues that need reminders
    const issues = await base44.asServiceRole.entities.Issue.filter({
      status: { $in: ["active", "in_progress"] }
    });

    const notifications = [];

    for (const issue of issues) {
      const user = await base44.asServiceRole.entities.User.filter({ 
        email: issue.created_by 
      });
      
      if (user.length === 0) continue;
      
      const userId = user[0].id;
      const userPrefs = user[0].notification_preferences || {};

      // Skip if user has reminders disabled
      if (userPrefs.reminders_enabled === false) continue;

      // Calculate days since issue was created
      const daysSinceCreated = Math.floor(
        (today - new Date(issue.created_date)) / (1000 * 60 * 60 * 24)
      );

      let shouldNotify = false;
      let reminderMessage = '';

      // Reminder logic based on urgency
      if (issue.urgency === "fix_now" && daysSinceCreated >= 1) {
        shouldNotify = true;
        reminderMessage = `Urgent: "${issue.title}" still needs attention. This issue requires immediate action to prevent damage or safety risks.`;
      } else if (issue.urgency === "fix_soon" && daysSinceCreated >= 7) {
        shouldNotify = true;
        reminderMessage = `Reminder: "${issue.title}" should be addressed soon. It's been ${daysSinceCreated} days since you reported this issue.`;
      } else if (issue.urgency === "ignore" && daysSinceCreated >= 30) {
        shouldNotify = true;
        reminderMessage = `Low priority: "${issue.title}" has been pending for ${daysSinceCreated} days. Consider addressing it when convenient.`;
      }

      if (shouldNotify) {
        // Create notification
        const notification = await base44.asServiceRole.entities.Notification.create({
          user_id: userId,
          title: "Issue Reminder",
          message: reminderMessage,
          type: "issue_update",
          priority: issue.urgency === "fix_now" ? "urgent" : "normal",
          related_entity_type: "Issue",
          related_entity_id: issue.id,
          action_url: `IssueDetail?id=${issue.id}`,
          sent_at: new Date().toISOString()
        });

        // Send via email if enabled
        if (userPrefs.email_enabled !== false) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user[0].email,
            subject: "QuoFix: Issue Reminder",
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #0F1E2E 0%, #1E3A57 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #F7B600; margin: 0;">QuoFix</h1>
                </div>
                <div style="padding: 30px; background: #fff;">
                  <h2 style="color: #1E3A57; margin-top: 0;">Issue Reminder</h2>
                  <p style="color: #333; line-height: 1.6;">${reminderMessage}</p>
                  <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #666; font-size: 14px;"><strong>Severity:</strong> ${issue.severity_score}/10</p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;"><strong>Days pending:</strong> ${daysSinceCreated}</p>
                  </div>
                  <a href="#" style="display: inline-block; background: #57CFA4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Issue</a>
                </div>
              </div>
            `
          });
        }

        notifications.push(notification);
      }
    }

    // Check for upcoming maintenance reminders
    const reminders = await base44.asServiceRole.entities.Reminder.filter({
      is_completed: false,
      reminder_date: { $lte: threeDaysFromNow.toISOString().split('T')[0] }
    });

    for (const reminder of reminders) {
      const user = await base44.asServiceRole.entities.User.filter({ 
        email: reminder.created_by 
      });
      
      if (user.length === 0) continue;
      
      const userId = user[0].id;
      const userPrefs = user[0].notification_preferences || {};

      if (userPrefs.reminders_enabled === false) continue;

      const daysUntil = Math.ceil(
        (new Date(reminder.reminder_date) - today) / (1000 * 60 * 60 * 24)
      );

      const notification = await base44.asServiceRole.entities.Notification.create({
        user_id: userId,
        title: daysUntil === 0 ? "Maintenance Due Today" : `Maintenance Due in ${daysUntil} Days`,
        message: `${reminder.title}: ${reminder.description || 'Scheduled maintenance reminder'}`,
        type: "appointment",
        priority: daysUntil === 0 ? "high" : "normal",
        related_entity_type: "Reminder",
        related_entity_id: reminder.id,
        action_url: "Reminders",
        sent_at: new Date().toISOString()
      });

      if (userPrefs.email_enabled !== false) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user[0].email,
          subject: `QuoFix: Maintenance Reminder - ${reminder.title}`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0F1E2E 0%, #1E3A57 100%); padding: 30px; text-align: center;">
                <h1 style="color: #F7B600; margin: 0;">QuoFix</h1>
              </div>
              <div style="padding: 30px; background: #fff;">
                <h2 style="color: #1E3A57; margin-top: 0;">${reminder.title}</h2>
                <p style="color: #333; line-height: 1.6;">${reminder.description || 'This is a reminder for scheduled maintenance.'}</p>
                <p style="color: #666; margin-top: 20px;">Due date: <strong>${new Date(reminder.reminder_date).toLocaleDateString()}</strong></p>
                <a href="#" style="display: inline-block; background: #57CFA4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Reminders</a>
              </div>
            </div>
          `
        });
      }

      notifications.push(notification);
    }

    return Response.json({ 
      success: true, 
      notifications_sent: notifications.length,
      notifications 
    });

  } catch (error) {
    console.error('Reminder scheduling error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { reminderId, userId } = await req.json();

    if (!reminderId || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the reminder details
    const reminders = await base44.asServiceRole.entities.Reminder.filter({ id: reminderId });
    if (reminders.length === 0) {
      return Response.json({ error: 'Reminder not found' }, { status: 404 });
    }
    const reminder = reminders[0];

    // Get user details
    const users = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    const title = `🔔 Maintenance Reminder`;
    const message = `Time for: ${reminder.title}`;
    const priority = 'normal';
    const actionUrl = `Reminders`;

    // Check user's notification preferences
    const prefs = user.notification_preferences || {};
    const shouldSendEmail = prefs.email_enabled !== false && prefs.reminder_enabled !== false;
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
                ${reminder.description ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #333;">${reminder.description}</p>
                </div>` : ''}
                <a href="https://app.base44.com/reminders" style="display: inline-block; background: #57CFA4; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: bold;">View Reminders</a>
              </div>
              <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #666; font-size: 12px;">
                <p style="margin: 0 0 10px 0;">You're receiving this because you have reminder notifications enabled in QuoFix.</p>
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
      type: 'appointment',
      priority,
      sent_via: sentVia,
      related_entity_type: 'Reminder',
      related_entity_id: reminderId,
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
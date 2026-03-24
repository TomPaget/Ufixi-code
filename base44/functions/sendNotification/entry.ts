import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, message, type, priority = "normal", relatedEntityType, relatedEntityId, actionUrl } = await req.json();

    // Get target user's notification preferences
    const targetUsers = await base44.asServiceRole.entities.User.filter({ id: userId });
    if (targetUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = targetUsers[0];
    const prefs = targetUser.notification_preferences || {};

    // Check if user wants this type of notification
    const typeKey = type.replace('_', '');
    if (prefs[`${typeKey}_enabled`] === false) {
      return Response.json({ success: false, message: 'User has disabled this notification type' });
    }

    const sentVia = [];

    // Send Email if enabled
    if (prefs.email_enabled !== false && targetUser.email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: targetUser.email,
          subject: title,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0F1E2E 0%, #1E3A57 100%); padding: 30px; text-align: center;">
                <h1 style="color: #F7B600; margin: 0;">Ufixi</h1>
              </div>
              <div style="padding: 30px; background: #fff;">
                <h2 style="color: #1E3A57; margin-top: 0;">${title}</h2>
                <p style="color: #333; line-height: 1.6;">${message}</p>
                ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background: #57CFA4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">View Details</a>` : ''}
              </div>
              <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #666; font-size: 12px;">
                <p>You're receiving this because you have notifications enabled in Ufixi.</p>
                <p><a href="#" style="color: #57CFA4;">Manage notification preferences</a></p>
              </div>
            </div>
          `
        });
        sentVia.push('email');
      } catch (error) {
        console.error('Email send error:', error);
      }
    }

    // Send Push Notification if enabled
    if (prefs.push_enabled !== false && targetUser.push_token) {
      // In a real app, you'd integrate with Firebase Cloud Messaging, OneSignal, etc.
      // For now, we'll just log it
      console.log('Push notification would be sent:', { title, message, userId });
      sentVia.push('push');
    }

    // Create notification record
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id: userId,
      title,
      message,
      type,
      priority,
      sent_via: sentVia,
      related_entity_type: relatedEntityType,
      related_entity_id: relatedEntityId,
      action_url: actionUrl,
      sent_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      notification,
      sent_via: sentVia
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
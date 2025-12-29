import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingId, type } = await req.json();

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    let recipientId, title, message, actionUrl;

    switch (type) {
      case 'new_booking_request':
        recipientId = booking.tradesperson_id;
        title = '📅 New Booking Request';
        message = `${booking.customer_name} has requested a booking for ${new Date(booking.proposed_date).toLocaleString()}`;
        actionUrl = `/Bookings?id=${bookingId}`;
        break;

      case 'booking_accepted':
        recipientId = booking.customer_id;
        title = '✅ Booking Accepted';
        message = `${booking.tradesperson_name} has accepted your booking request for ${new Date(booking.proposed_date).toLocaleString()}`;
        actionUrl = `/Bookings?id=${bookingId}`;
        break;

      case 'booking_confirmed':
        recipientId = booking.tradesperson_id;
        title = '✅ Booking Confirmed';
        message = `${booking.customer_name} has confirmed the booking for ${new Date(booking.confirmed_date).toLocaleString()}`;
        actionUrl = `/Bookings?id=${bookingId}`;
        break;

      case 'booking_declined':
        recipientId = booking.customer_id;
        title = '❌ Booking Declined';
        message = `${booking.tradesperson_name} is not available at the requested time. Please suggest alternative dates.`;
        actionUrl = `/Bookings?id=${bookingId}`;
        break;

      case 'booking_reminder_24h':
        // Send to both parties
        const notifications = [];
        
        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            user_id: booking.customer_id,
            title: '⏰ Booking Reminder - Tomorrow',
            message: `Your appointment with ${booking.tradesperson_name} is tomorrow at ${new Date(booking.confirmed_date).toLocaleTimeString()}`,
            type: 'appointment',
            priority: 'high',
            action_url: `/Bookings?id=${bookingId}`,
            related_entity_type: 'Booking',
            related_entity_id: bookingId
          })
        );

        notifications.push(
          base44.asServiceRole.entities.Notification.create({
            user_id: booking.tradesperson_id,
            title: '⏰ Booking Reminder - Tomorrow',
            message: `You have an appointment with ${booking.customer_name} tomorrow at ${new Date(booking.confirmed_date).toLocaleTimeString()}`,
            type: 'appointment',
            priority: 'high',
            action_url: `/Bookings?id=${bookingId}`,
            related_entity_type: 'Booking',
            related_entity_id: bookingId
          })
        );

        await Promise.all(notifications);
        await base44.asServiceRole.entities.Booking.update(bookingId, {
          reminder_sent: true
        });

        return Response.json({ success: true, notifications: 2 });

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: recipientId,
      title,
      message,
      type: 'appointment',
      priority: type.includes('reminder') ? 'high' : 'normal',
      action_url: actionUrl,
      related_entity_type: 'Booking',
      related_entity_id: bookingId
    });

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error creating booking notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
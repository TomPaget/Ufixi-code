import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { deviceId, eventType, eventData, userId } = await req.json();

    if (!deviceId || !eventType || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get device info
    const devices = await base44.asServiceRole.entities.SmartHomeDevice.filter({ 
      device_id: deviceId 
    });
    
    if (devices.length === 0) {
      return Response.json({ error: 'Device not found' }, { status: 404 });
    }

    const device = devices[0];

    // Check if monitoring is enabled
    if (!device.monitoring_enabled) {
      return Response.json({ status: 'ignored', reason: 'Monitoring disabled' });
    }

    // Analyze the event and determine if it's an issue
    let shouldCreateAlert = false;
    let alertType = 'other';
    let severity = 'medium';
    let description = '';
    let readingValue = null;
    let thresholdValue = null;

    // Water leak detection
    if (eventType === 'water_detected' || eventData.water_leak === true) {
      shouldCreateAlert = true;
      alertType = 'water_leak';
      severity = 'critical';
      description = `Water leak detected by ${device.device_name}`;
    }

    // Energy consumption spike
    if (eventType === 'high_power' && eventData.power > 3000) {
      shouldCreateAlert = true;
      alertType = 'high_energy_consumption';
      severity = 'high';
      description = `Unusually high energy consumption: ${eventData.power}W`;
      readingValue = eventData.power;
      thresholdValue = 3000;
    }

    // Temperature spike
    if (eventType === 'temperature' && eventData.temperature) {
      const temp = eventData.temperature;
      if (temp > 30 || temp < 5) {
        shouldCreateAlert = true;
        alertType = 'temperature_spike';
        severity = temp > 35 || temp < 0 ? 'high' : 'medium';
        description = `Unusual temperature detected: ${temp}°C`;
        readingValue = temp;
        thresholdValue = temp > 30 ? 30 : 5;
      }
    }

    // Humidity spike
    if (eventType === 'humidity' && eventData.humidity > 70) {
      shouldCreateAlert = true;
      alertType = 'humidity_spike';
      severity = 'medium';
      description = `High humidity detected: ${eventData.humidity}%`;
      readingValue = eventData.humidity;
      thresholdValue = 70;
    }

    // Smoke detected
    if (eventType === 'smoke_detected' || eventData.smoke === true) {
      shouldCreateAlert = true;
      alertType = 'smoke_detected';
      severity = 'critical';
      description = `Smoke detected by ${device.device_name}`;
    }

    // CO detected
    if (eventType === 'co_detected' || eventData.carbon_monoxide === true) {
      shouldCreateAlert = true;
      alertType = 'co_detected';
      severity = 'critical';
      description = `Carbon monoxide detected by ${device.device_name}`;
    }

    if (!shouldCreateAlert) {
      // Just update the device's last reading
      await base44.asServiceRole.entities.SmartHomeDevice.update(device.id, {
        last_reading: eventData
      });

      return Response.json({ 
        status: 'ok', 
        message: 'Event logged, no alert needed' 
      });
    }

    // Create alert
    const alert = await base44.asServiceRole.entities.SmartHomeAlert.create({
      device_id: deviceId,
      device_name: device.device_name,
      alert_type: alertType,
      severity: severity,
      description: description,
      reading_value: readingValue,
      threshold_value: thresholdValue,
      status: 'new',
      created_by: userId
    });

    // Send notification to user
    try {
      await base44.asServiceRole.functions.invoke('sendNotification', {
        userId: userId,
        title: `Smart Home Alert: ${device.device_name}`,
        message: description,
        type: 'smart_home_alert',
        priority: severity === 'critical' ? 'urgent' : 'high',
        related_entity_type: 'SmartHomeAlert',
        related_entity_id: alert.id
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return Response.json({ 
      status: 'alert_created',
      alert_id: alert.id,
      severity: severity
    });

  } catch (error) {
    console.error('Smart home event processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
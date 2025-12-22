import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    const targetUserId = userId || user.id;

    // Fetch user's issue history
    const issues = await base44.asServiceRole.entities.Issue.filter({
      created_by: user.email
    });

    // Fetch user's job history (if tradesperson)
    const jobs = user.account_type === 'trades' 
      ? await base44.asServiceRole.entities.Job.filter({
          tradesperson_id: targetUserId
        })
      : [];

    // Fetch existing reminders
    const reminders = await base44.asServiceRole.entities.Reminder.filter({
      created_by: user.email
    });

    // Get current date and season
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const season = month >= 3 && month <= 5 ? 'spring' :
                   month >= 6 && month <= 8 ? 'summer' :
                   month >= 9 && month <= 11 ? 'autumn' : 'winter';

    // Prepare analysis context
    const issuesSummary = issues.map(i => ({
      category: i.trade_type,
      severity: i.severity_score,
      date: i.created_date,
      resolved: i.status === 'resolved'
    }));

    const jobsSummary = jobs.map(j => ({
      category: j.trade_type,
      cost: j.actual_cost || j.estimated_cost,
      date: j.completion_date || j.created_date
    }));

    // Use AI to analyze patterns and generate maintenance predictions
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a predictive maintenance expert analyzing property history for proactive maintenance planning.

USER PROFILE:
- User Type: ${user.account_type === 'trades' ? 'Tradesperson' : 'Property Owner/Tenant'}
- Location: ${user.country || 'UK'}
- Current Season: ${season}
- Property Age: ${user.property_age || 'Unknown'}

HISTORICAL DATA:
Past Issues (${issues.length}):
${JSON.stringify(issuesSummary, null, 2)}

${jobs.length > 0 ? `Completed Jobs (${jobs.length}):\n${JSON.stringify(jobsSummary, null, 2)}` : ''}

Existing Reminders:
${reminders.map(r => `- ${r.title} (${r.category}, next: ${r.reminder_date})`).join('\n')}

ANALYSIS TASK:
Based on this data, predict 3-5 upcoming maintenance needs using:

1. PATTERN ANALYSIS:
   - Recurring issues in the same category
   - Time-based patterns (seasonal, age-related)
   - Common failure sequences (one issue often leads to another)

2. SEASONAL PREDICTIONS (${season}):
   - Spring: HVAC cooling prep, gutter cleaning, roof inspection
   - Summer: AC maintenance, outdoor plumbing, deck/patio checks
   - Autumn: Heating system check, insulation review, winterization
   - Winter: Boiler service, pipe freeze prevention, draft sealing

3. PROPERTY AGE & LIFECYCLE:
   - Typical component lifespans (water heaters: 8-12 yrs, HVAC: 10-15 yrs)
   - Preventative maintenance schedules
   - Early warning signs from past issues

4. COST-BENEFIT ANALYSIS:
   - Maintenance that prevents expensive repairs
   - Small interventions that avoid major issues
   - Regular servicing vs emergency repairs

For ${user.account_type === 'trades' ? 'TRADESPEOPLE' : 'CUSTOMERS'}:
${user.account_type === 'trades' 
  ? '- Identify opportunities where you can reach out to past customers\n- Suggest seasonal services you can offer\n- Predict when customers will need your expertise' 
  : '- Identify maintenance that will save money long-term\n- Prioritize by urgency and cost\n- Suggest preventative actions'}

RETURN FORMAT:
For each predicted maintenance need, provide:
- Type: "preventative", "seasonal", "pattern_based", or "age_based"
- Category: trade category
- Title: Clear, actionable title
- Description: Why this is needed now (3-4 sentences with evidence)
- Urgency: "low", "medium", or "high"
- Cost estimate range (${user.currency || 'GBP'})
- Recommended action: Specific next step
- When to do it: Suggested timeframe
- Reasoning: Evidence-based justification
- Confidence: 0-100 score based on data quality

Be specific, practical, and evidence-based. Don't suggest maintenance that was recently completed.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                alert_type: {
                  type: "string",
                  enum: ["preventative", "seasonal", "pattern_based", "age_based"]
                },
                category: {
                  type: "string",
                  enum: ["plumbing", "electrical", "hvac", "appliances", "structural", "general"]
                },
                title: { type: "string" },
                description: { type: "string" },
                urgency: {
                  type: "string",
                  enum: ["low", "medium", "high"]
                },
                predicted_cost_min: { type: "number" },
                predicted_cost_max: { type: "number" },
                recommended_action: { type: "string" },
                estimated_date: { type: "string" },
                reasoning: { type: "string" },
                ai_confidence: { type: "number" }
              },
              required: ["alert_type", "category", "title", "description", "urgency", "recommended_action"]
            }
          }
        },
        required: ["alerts"]
      }
    });

    // Save alerts to database
    const savedAlerts = [];
    for (const alert of analysis.alerts) {
      const saved = await base44.asServiceRole.entities.MaintenanceAlert.create({
        ...alert,
        user_id: targetUserId,
        status: "pending"
      });
      savedAlerts.push(saved);

      // Create notification for high urgency alerts
      if (alert.urgency === 'high') {
        await base44.asServiceRole.entities.Notification.create({
          user_id: targetUserId,
          title: `Recommended: ${alert.title}`,
          message: alert.description,
          type: 'general',
          priority: 'high',
          related_entity_type: 'MaintenanceAlert',
          related_entity_id: saved.id
        });
      }
    }

    return Response.json({
      success: true,
      alerts: savedAlerts,
      count: savedAlerts.length,
      message: `Generated ${savedAlerts.length} maintenance predictions`
    });

  } catch (error) {
    console.error('Alert generation failed:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});
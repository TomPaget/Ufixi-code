import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role access for analysis
    const users = await base44.asServiceRole.entities.User.list();
    const allIssues = await base44.asServiceRole.entities.Issue.list('-created_date', 500);
    const allJobs = await base44.asServiceRole.entities.Job.list('-created_date', 500);
    const allReminders = await base44.asServiceRole.entities.Reminder.list();
    
    const predictions = [];
    
    for (const user of users) {
      // Skip if user has no home profile data
      if (!user.property_type && !user.property_age) continue;
      
      const userIssues = allIssues.filter(i => i.created_by === user.email);
      const userJobs = allJobs.filter(j => j.customer_id === user.id);
      const userReminders = allReminders.filter(r => r.created_by === user.email);
      
      // Build context for AI analysis
      const issueHistory = userIssues.slice(0, 20).map(i => ({
        title: i.title,
        trade_type: i.trade_type,
        severity: i.severity_score,
        date: i.created_date,
        resolved: i.status === 'resolved'
      }));
      
      const jobHistory = userJobs.slice(0, 20).map(j => ({
        title: j.title,
        trade_type: j.trade_type,
        completion_date: j.completion_date,
        status: j.status
      }));
      
      const existingReminders = userReminders.map(r => ({
        title: r.title,
        category: r.category,
        reminder_date: r.reminder_date
      }));
      
      // AI Analysis for predictive maintenance
      const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a predictive maintenance expert analyzing home maintenance patterns.

USER PROFILE:
- Property Type: ${user.property_type || 'Unknown'}
- Property Age: ${user.property_age || 'Unknown'} years
- Country: ${user.country || 'UK'}
- User Type: ${user.user_type || 'homeowner'}

ISSUE HISTORY (last 20):
${JSON.stringify(issueHistory, null, 2)}

JOB HISTORY (last 20):
${JSON.stringify(jobHistory, null, 2)}

EXISTING REMINDERS:
${JSON.stringify(existingReminders, null, 2)}

CURRENT DATE: ${new Date().toISOString().split('T')[0]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PREDICTIVE ANALYSIS REQUIRED:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze patterns and predict:

1. RECURRING ISSUES: What problems keep coming back? Why?
2. SEASONAL PATTERNS: What typically fails in this season?
3. PROPERTY AGE RISKS: What components are due for failure based on property age?
4. PATTERN-BASED PREDICTIONS: Based on issue frequency, what's likely to break next?
5. PREVENTATIVE ACTIONS: What maintenance can prevent future issues?

For each prediction, provide:
- Category: "hvac", "plumbing", "electrical", "appliances", "exterior", "other"
- Priority: "low", "medium", "high", "urgent"
- Title: Clear maintenance action needed
- Description: Why this is needed now (2-3 sentences with specific reasoning)
- Recommended_date: When to act (YYYY-MM-DD format, within next 6 months)
- Cost_estimate: Typical cost in ${user.currency || 'GBP'}
- Consequence: What happens if ignored
- Trade_needed: Type of professional needed (or "DIY" if simple)

RULES:
- Only suggest items NOT already in their reminders
- Focus on HIGH-VALUE predictions (real failure risks, not generic advice)
- Consider property age: older properties need more frequent checks
- Factor in seasonal patterns (e.g., HVAC before summer/winter)
- Prioritize safety-critical systems (gas, electrical, water)
- Max 5 predictions per user
- Be specific and actionable

Return predictions sorted by priority (urgent first).`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["hvac", "plumbing", "electrical", "appliances", "exterior", "other"]
                  },
                  priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"]
                  },
                  title: { type: "string" },
                  description: { type: "string" },
                  recommended_date: { type: "string" },
                  cost_estimate: { type: "string" },
                  consequence: { type: "string" },
                  trade_needed: { type: "string" }
                },
                required: ["category", "priority", "title", "description", "recommended_date"]
              }
            }
          }
        }
      });
      
      if (analysis.predictions && analysis.predictions.length > 0) {
        predictions.push({
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          predictions: analysis.predictions
        });
        
        // Create notifications and reminders for high/urgent priority items
        for (const pred of analysis.predictions) {
          if (pred.priority === 'high' || pred.priority === 'urgent') {
            // Create notification
            await base44.asServiceRole.entities.Notification.create({
              user_id: user.id,
              title: `Preventative Maintenance: ${pred.title}`,
              message: pred.description,
              type: 'general',
              priority: pred.priority === 'urgent' ? 'urgent' : 'high',
              related_entity_type: 'Reminder',
              action_url: '/Reminders'
            });
            
            // Auto-create reminder
            await base44.asServiceRole.entities.Reminder.create({
              created_by: user.email,
              title: pred.title,
              description: `${pred.description}\n\n${pred.consequence ? `⚠️ If ignored: ${pred.consequence}` : ''}\n\nEstimated cost: ${pred.cost_estimate || 'TBD'}${pred.trade_needed ? `\nProfessional needed: ${pred.trade_needed}` : ''}`,
              reminder_date: pred.recommended_date,
              category: pred.category,
              is_completed: false
            });
          }
        }
      }
    }
    
    // Also notify tradespeople about potential opportunities
    const tradespeople = users.filter(u => u.account_type === 'trades' && u.trades_verified);
    
    for (const tradesperson of tradespeople) {
      const specialty = tradesperson.trades_specialty;
      if (!specialty) continue;
      
      // Find customers in their service area with predicted maintenance needs
      const opportunities = predictions.filter(p => 
        p.predictions.some(pred => 
          pred.trade_needed?.toLowerCase().includes(specialty.toLowerCase()) &&
          (pred.priority === 'high' || pred.priority === 'urgent')
        )
      );
      
      if (opportunities.length > 0) {
        const opportunityCount = opportunities.reduce((sum, opp) => 
          sum + opp.predictions.filter(p => p.trade_needed?.toLowerCase().includes(specialty.toLowerCase())).length, 
          0
        );
        
        await base44.asServiceRole.entities.Notification.create({
          user_id: tradesperson.id,
          title: `${opportunityCount} Potential Jobs in Your Area`,
          message: `Based on our predictive analysis, ${opportunityCount} customers in your service area may need ${specialty} services soon. These are preventative maintenance opportunities.`,
          type: 'general',
          priority: 'normal',
          action_url: '/TradesDashboard'
        });
      }
    }
    
    return Response.json({
      success: true,
      total_users_analyzed: users.length,
      predictions_generated: predictions.length,
      notifications_sent: predictions.reduce((sum, p) => 
        sum + p.predictions.filter(pred => pred.priority === 'high' || pred.priority === 'urgent').length, 
        0
      ),
      predictions: predictions
    });
    
  } catch (error) {
    console.error('Predictive maintenance failed:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
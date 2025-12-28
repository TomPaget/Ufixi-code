import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId } = await req.json();

    if (!issueId) {
      return Response.json({ error: 'Issue ID required' }, { status: 400 });
    }

    // Get the issue
    const issues = await base44.entities.Issue.filter({ id: issueId });
    const issue = issues[0];

    if (!issue || issue.created_by !== user.email) {
      return Response.json({ error: 'Issue not found or access denied' }, { status: 403 });
    }

    // Get user's other issues for context
    const userIssues = await base44.entities.Issue.filter({ 
      created_by: user.email,
      status: { $in: ['active', 'in_progress'] }
    });

    // Calculate cost impact score
    const avgCost = issue.pro_cost_max ? (issue.pro_cost_min + issue.pro_cost_max) / 2 : 0;
    const costImpactScore = avgCost > 1000 ? 100 : avgCost > 500 ? 75 : avgCost > 200 ? 50 : 25;

    // AI-powered priority analysis
    const priorityAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a home maintenance expert analyzing issue priority to help homeowners make informed decisions.

ISSUE DETAILS:
- Title: ${issue.title}
- Description: ${issue.explanation}
- Severity Score: ${issue.severity_score}/10
- Urgency: ${issue.urgency}
- Trade Type: ${issue.trade_type}
- Safety Warnings: ${issue.safety_warnings?.length || 0} warnings
- DIY Safe: ${issue.diy_safe}
- Estimated Professional Cost: £${issue.pro_cost_min}-£${issue.pro_cost_max || 'Unknown'}
- Average Cost: £${avgCost.toFixed(0)}
- Cost Impact Score: ${costImpactScore}/100

USER CONTEXT:
- Total Active Issues: ${userIssues.length}
- Account Type: ${user.account_type || 'customer'}

RISK FACTORS:
${issue.risks?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'None specified'}

PRIORITY SCORING CRITERIA:
1. **Safety Risk (40% weight)**
   - Immediate danger to life/health = Critical
   - Potential for injury or major damage = High
   - Minor safety concerns = Medium
   - No safety risk = Low

2. **Financial Impact (30% weight)**
   - Costs escalate rapidly if ignored (>£100/week) = High
   - Moderate cost increase potential = Medium
   - Minimal cost impact = Low

3. **Urgency & Time Sensitivity (20% weight)**
   - Requires immediate action = Critical
   - Should be fixed within days = High
   - Can wait weeks = Medium
   - Can be scheduled flexibly = Low

4. **Cascading Effects (10% weight)**
   - Could damage multiple systems = High
   - Isolated issue = Low

TASK:
Analyze all factors and assign ONE priority level: "critical", "high", "medium", or "low"

GUIDELINES:
- ANY active water/gas leak, electrical hazard, structural risk = CRITICAL
- Severity 8-10 + fix_now urgency = CRITICAL
- Severity 6-10 + high cost + safety warnings = HIGH
- Severity 4-6 + moderate cost = MEDIUM
- Severity 1-3 + cosmetic only = LOW

Provide reasoning for your decision.`,
      response_json_schema: {
        type: "object",
        properties: {
          priority: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "Overall priority level"
          },
          priority_score: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Numerical priority score"
          },
          reasoning: {
            type: "string",
            description: "Why this priority was assigned"
          },
          key_factors: {
            type: "array",
            items: { type: "string" },
            description: "Main factors influencing priority"
          },
          recommended_timeframe: {
            type: "string",
            description: "When to address this (e.g., 'Within 24 hours', 'This week', 'This month')"
          }
        },
        required: ["priority", "priority_score", "reasoning"]
      }
    });

    // Update issue with priority
    await base44.entities.Issue.update(issueId, {
      priority: priorityAnalysis.priority,
      priority_score: priorityAnalysis.priority_score,
      priority_reasoning: priorityAnalysis.reasoning,
      priority_key_factors: priorityAnalysis.key_factors,
      recommended_timeframe: priorityAnalysis.recommended_timeframe
    });

    return Response.json({
      success: true,
      ...priorityAnalysis
    });

  } catch (error) {
    return Response.json({ 
      error: 'Priority calculation failed' 
    }, { status: 500 });
  }
});
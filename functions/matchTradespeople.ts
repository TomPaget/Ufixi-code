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
      return Response.json({ error: 'Issue ID is required' }, { status: 400 });
    }

    // Get issue details
    const issues = await base44.entities.Issue.filter({ id: issueId });
    if (issues.length === 0) {
      return Response.json({ error: 'Issue not found' }, { status: 404 });
    }
    const issue = issues[0];

    // Get all approved tradespeople
    const tradespeople = await base44.asServiceRole.entities.User.filter({
      account_type: 'trades',
      trades_status: 'approved'
    });

    if (tradespeople.length === 0) {
      return Response.json({
        success: true,
        matches: [],
        message: 'No tradespeople available yet'
      });
    }

    // Prepare tradespeople data for AI analysis
    const tradesData = tradespeople.map(t => ({
      id: t.id,
      name: t.trades_business_name || t.full_name,
      specialty: t.trades_specialty,
      specialties: t.trades_specialties,
      location: t.trades_location,
      service_area: t.trades_service_area,
      hourly_rate: t.trades_hourly_rate,
      rating: t.trades_rating || 3,
      years_operated: t.trades_years_operated,
      bio: t.trades_bio?.substring(0, 150)
    }));

    // AI-powered matching
    const matchAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert at matching home repair issues with the best tradesperson for the job.

ISSUE DETAILS:
- Title: ${issue.title}
- Description: ${issue.explanation}
- Trade Type: ${issue.trade_type}
- Urgency: ${issue.urgency}
- Severity: ${issue.severity_score}/10
- User Location: ${user.trades_location || 'Not specified'}
- Estimated Cost: ${issue.pro_cost_min}-${issue.pro_cost_max}

AVAILABLE TRADESPEOPLE:
${JSON.stringify(tradesData, null, 2)}

TASK:
Analyze and rank the top 3-5 most suitable tradespeople for this job based on:
1. Specialty match (primary factor)
2. Location/service area proximity
3. Hourly rate (cost-effectiveness)
4. Rating and experience
5. Urgency compatibility

For each match, provide:
- Match score (0-100)
- Why they're suitable
- Estimated cost for this job
- Recommended contact action (quote, visit, emergency_call)`,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tradesperson_id: { type: "string" },
                match_score: { type: "number", minimum: 0, maximum: 100 },
                suitability_reason: { type: "string" },
                estimated_job_cost: { type: "number" },
                recommended_action: { 
                  type: "string",
                  enum: ["request_quote", "request_visit", "emergency_call", "general_inquiry"]
                },
                pros: {
                  type: "array",
                  items: { type: "string" }
                },
                considerations: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["tradesperson_id", "match_score", "suitability_reason"]
            }
          },
          overall_recommendation: { type: "string" }
        },
        required: ["matches"]
      }
    });

    // Enrich matches with full tradesperson data
    const enrichedMatches = matchAnalysis.matches.map(match => {
      const tradesperson = tradespeople.find(t => t.id === match.tradesperson_id);
      return {
        ...match,
        tradesperson: {
          id: tradesperson.id,
          name: tradesperson.trades_business_name || tradesperson.full_name,
          specialty: tradesperson.trades_specialty,
          location: tradesperson.trades_location,
          hourly_rate: tradesperson.trades_hourly_rate,
          rating: tradesperson.trades_rating || 3,
          years_operated: tradesperson.trades_years_operated,
          bio: tradesperson.trades_bio
        }
      };
    });

    return Response.json({
      success: true,
      matches: enrichedMatches,
      overall_recommendation: matchAnalysis.overall_recommendation,
      total_available: tradespeople.length
    });

  } catch (error) {
    console.error('Tradesperson matching error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
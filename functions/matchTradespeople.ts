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

    // Get all approved tradespeople with trust scores
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

    // Calculate proximity scores
    const userLocation = user.postcode || user.trades_location || '';
    const calculateProximity = (tradeLocation) => {
      if (!userLocation || !tradeLocation) return 50;
      const userLower = userLocation.toLowerCase();
      const tradeLower = tradeLocation.toLowerCase();
      
      // Exact match
      if (userLower === tradeLower) return 100;
      
      // Same postcode prefix (e.g., "SW1" matches "SW1 2AB")
      const userPrefix = userLower.split(' ')[0];
      const tradePrefix = tradeLower.split(' ')[0];
      if (userPrefix === tradePrefix) return 90;
      
      // Contains location name
      if (userLower.includes(tradeLower) || tradeLower.includes(userLower)) return 70;
      
      return 30; // Different area
    };

    // Prepare tradespeople data for AI analysis with enhanced metrics
    const tradesData = tradespeople.map(t => ({
      id: t.id,
      name: t.trades_business_name || t.full_name,
      specialty: t.trades_specialty,
      specialties: t.trades_specialties || [],
      location: t.trades_location,
      service_area: t.trades_service_area,
      hourly_rate: t.trades_hourly_rate || 50,
      rating: t.trades_rating || 3,
      years_operated: t.trades_years_operated || 1,
      bio: t.trades_bio?.substring(0, 150),
      trust_score: t.trust_score || 70,
      professionalism_score: t.professionalism_score || 70,
      responsiveness_score: t.responsiveness_score || 70,
      avg_response_time: t.avg_response_time || 'Unknown',
      total_reviews: t.total_reviews || 0,
      proximity_score: calculateProximity(t.trades_location),
      available_immediately: t.trades_available_immediately !== false,
      emergency_service: t.trades_emergency_service === true
    }));

    // AI-powered matching with comprehensive analysis
    const matchAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI expert at matching home repair issues with the most suitable verified tradespeople.

━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: ${issue.title}
Description: ${issue.explanation}
Trade Type: ${issue.trade_type}
Urgency: ${issue.urgency} (${issue.urgency === 'fix_now' ? 'IMMEDIATE' : issue.urgency === 'fix_soon' ? 'WITHIN DAYS' : 'LOW PRIORITY'})
Severity: ${issue.severity_score}/10
Safety Concerns: ${issue.safety_warnings?.length > 0 ? 'YES' : 'No'}
User Location: ${userLocation || 'Not specified'}
Estimated Professional Cost: ${issue.pro_cost_min}-${issue.pro_cost_max}

${issue.sentiment_analysis ? `
User Emotional State: ${issue.sentiment_analysis.emotional_state}
Stress Level: ${issue.sentiment_analysis.sentiment_score < -0.3 ? 'High' : 'Normal'}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
AVAILABLE TRADESPEOPLE (${tradesData.length} total):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${JSON.stringify(tradesData, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
MATCHING CRITERIA (Weighted):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Specialty Match** (35%): Does their expertise match the issue type?
2. **Trust & Quality** (25%): Trust score, reviews, professionalism
3. **Proximity** (20%): Distance/location match for quick response
4. **Availability** (10%): Can they respond to urgency requirements?
5. **Cost-Effectiveness** (10%): Reasonable rates vs. estimated job cost

━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Select and rank TOP 3-5 tradespeople ONLY. Quality over quantity.

SELECTION RULES:
- If urgency = "fix_now" → Prioritize emergency_service=true and proximity_score>70
- If severity ≥ 8 → Prefer trust_score ≥ 80 and years_operated ≥ 3
- If safety concerns → ONLY recommend highly trusted (trust_score ≥ 85)
- Specialty must be relevant (exact match or closely related)
- Proximity_score < 30 = only include if no better local options

For EACH selected tradesperson, provide:
- **match_score** (0-100): Overall match quality
- **suitability_reason** (2-3 sentences): Why they're the right choice
- **estimated_job_cost**: Realistic estimate based on hourly_rate and issue complexity
- **recommended_action**: "request_quote" | "request_visit" | "emergency_call" | "general_inquiry"
- **confidence_level**: "high" | "medium" | "low"
- **pros** (3-4 points): Specific strengths
- **considerations** (2-3 points): Potential concerns or things to verify
- **estimated_response_time**: Expected time to first response
- **why_top_choice** (for #1 match only): 1 sentence compelling reason`,
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
                confidence_level: {
                  type: "string",
                  enum: ["high", "medium", "low"]
                },
                pros: {
                  type: "array",
                  items: { type: "string" }
                },
                considerations: {
                  type: "array",
                  items: { type: "string" }
                },
                estimated_response_time: { type: "string" },
                why_top_choice: { type: "string" }
              },
              required: ["tradesperson_id", "match_score", "suitability_reason", "recommended_action"]
            }
          },
          overall_recommendation: { type: "string" },
          matching_confidence: { type: "string" },
          urgency_note: { type: "string" }
        },
        required: ["matches", "overall_recommendation"]
      }
    });

    // Enrich matches with full tradesperson data
    const enrichedMatches = matchAnalysis.matches.map((match, index) => {
      const tradesperson = tradespeople.find(t => t.id === match.tradesperson_id);
      const tradesInfo = tradesData.find(t => t.id === match.tradesperson_id);
      
      return {
        ...match,
        rank: index + 1,
        tradesperson: {
          id: tradesperson.id,
          name: tradesperson.trades_business_name || tradesperson.full_name,
          specialty: tradesperson.trades_specialty,
          location: tradesperson.trades_location,
          hourly_rate: tradesperson.trades_hourly_rate || 50,
          rating: tradesperson.trades_rating || 3,
          years_operated: tradesperson.trades_years_operated || 1,
          bio: tradesperson.trades_bio,
          trust_score: tradesperson.trust_score || 70,
          professionalism_score: tradesperson.professionalism_score || 70,
          responsiveness_score: tradesperson.responsiveness_score || 70,
          avg_response_time: tradesperson.avg_response_time || 'Unknown',
          total_reviews: tradesperson.total_reviews || 0,
          proximity_score: tradesInfo.proximity_score,
          emergency_service: tradesperson.trades_emergency_service === true
        }
      };
    });

    return Response.json({
      success: true,
      matches: enrichedMatches,
      overall_recommendation: matchAnalysis.overall_recommendation,
      matching_confidence: matchAnalysis.matching_confidence,
      urgency_note: matchAnalysis.urgency_note,
      total_available: tradespeople.length,
      analysis_timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tradesperson matching error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
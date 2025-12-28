import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueDescription, category, tradeType } = await req.json();

    if (!issueDescription) {
      return Response.json({ error: 'Issue description is required' }, { status: 400 });
    }
    
    // Sanitize and limit input length
    const sanitizedDescription = issueDescription.substring(0, 500);

    // Get all resolved issues for analysis
    const allIssues = await base44.asServiceRole.entities.Issue.filter({ 
      status: 'resolved' 
    }, '-updated_date', 50);

    if (allIssues.length === 0) {
      return Response.json({
        success: true,
        similarIssues: [],
        insights: null
      });
    }

    // Prepare issue summaries for AI analysis
    const issueSummaries = allIssues.map(issue => ({
      id: issue.id,
      title: issue.title,
      explanation: issue.explanation?.substring(0, 200),
      trade_type: issue.trade_type,
      urgency: issue.urgency,
      severity_score: issue.severity_score,
      resolution_notes: issue.resolution_notes,
      diy_steps: issue.diy_steps?.slice(0, 3), // First 3 steps only
      pro_cost_avg: issue.pro_cost_max ? (issue.pro_cost_min + issue.pro_cost_max) / 2 : null
    }));

    // Use AI to find similar issues and extract insights
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are analyzing a new home repair issue to find similar historical cases and predict effective solutions.

NEW ISSUE:
Description: "${sanitizedDescription}"
Category: ${category || 'unknown'}
Trade Type: ${tradeType || 'unknown'}

HISTORICAL RESOLVED ISSUES DATABASE:
${JSON.stringify(issueSummaries, null, 2)}

TASK:
1. Identify the 3-5 most similar historical issues based on symptoms, root causes, and trade type
2. Extract common patterns from successful resolutions
3. Identify what solutions worked best historically
4. Note any red flags or complications that appeared in similar cases
5. Predict the most effective solution approach based on historical success rates

Provide actionable insights for this new issue.`,
      response_json_schema: {
        type: "object",
        properties: {
          similar_issue_ids: {
            type: "array",
            items: { type: "string" },
            description: "IDs of most similar historical issues"
          },
          similarity_reasons: {
            type: "array",
            items: { type: "string" },
            description: "Why each issue is similar"
          },
          common_patterns: {
            type: "array",
            items: { type: "string" },
            description: "Patterns found in similar cases"
          },
          recommended_approach: {
            type: "string",
            description: "Best approach based on historical data"
          },
          success_factors: {
            type: "array",
            items: { type: "string" },
            description: "What made resolutions successful"
          },
          warning_signs: {
            type: "array",
            items: { type: "string" },
            description: "Complications to watch for"
          },
          estimated_success_rate: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Predicted success rate for DIY approach"
          }
        },
        required: ["similar_issue_ids", "recommended_approach"]
      }
    });

    // Get full details of similar issues
    const similarIssues = allIssues.filter(issue => 
      analysis.similar_issue_ids.includes(issue.id)
    );

    return Response.json({
      success: true,
      similarIssues,
      insights: analysis,
      total_historical_cases: allIssues.length
    });

  } catch (error) {
    console.error('Similar issues analysis error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
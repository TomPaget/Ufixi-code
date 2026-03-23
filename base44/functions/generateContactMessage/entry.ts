import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId, tradespersonId, actionType } = await req.json();

    if (!issueId || !tradespersonId || !actionType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get issue details
    const issues = await base44.asServiceRole.entities.Issue.filter({ id: issueId });
    if (issues.length === 0) {
      return Response.json({ error: 'Issue not found' }, { status: 404 });
    }
    const issue = issues[0];

    // Get tradesperson details
    const tradespeople = await base44.asServiceRole.entities.User.filter({ id: tradespersonId });
    if (tradespeople.length === 0) {
      return Response.json({ error: 'Tradesperson not found' }, { status: 404 });
    }
    const tradesperson = tradespeople[0];

    // Generate personalized message based on action type
    const messageGeneration = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional, courteous message from a homeowner to a tradesperson.

HOMEOWNER: ${user.full_name}
TRADESPERSON: ${tradesperson.trades_business_name || tradesperson.full_name}
ACTION TYPE: ${actionType}

ISSUE DETAILS:
- Problem: ${issue.title}
- Description: ${issue.explanation}
- Urgency: ${issue.urgency}
- Severity: ${issue.severity_score}/10
${issue.sentiment_analysis?.emotional_state ? `- Customer mood: ${issue.sentiment_analysis.emotional_state}` : ''}

REQUIREMENTS:
1. Professional but friendly tone
2. Clearly state the request (${actionType === 'request_quote' ? 'quote request' : actionType === 'request_visit' ? 'site visit request' : 'inquiry'})
3. Provide key issue details
4. Include urgency if relevant
5. Be concise (3-4 sentences max)
6. Include location if available: ${user.trades_location || 'location not specified'}

Generate the message text only, no extra formatting.`,
      response_json_schema: {
        type: "object",
        properties: {
          message: { type: "string" },
          subject: { type: "string" }
        },
        required: ["message", "subject"]
      }
    });

    return Response.json({
      success: true,
      generated_message: messageGeneration
    });

  } catch (error) {
    console.error('Message generation error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
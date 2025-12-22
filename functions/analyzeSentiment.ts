import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, context } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Analyze sentiment and extract insights
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze the emotional state and underlying concerns in this text from a homeowner describing a maintenance issue:

"${text}"

Context: ${context || 'User submitting a home repair issue'}

Provide:
1. Sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
2. Emotional state (calm, concerned, anxious, frustrated, panicked, etc.)
3. Urgency indicators (keywords/phrases suggesting time pressure or stress)
4. Hidden concerns (underlying worries they might not explicitly state - safety fears, financial anxiety, past experiences, etc.)
5. Keywords (key terms about the issue)
6. Suggested tone (how we should respond - reassuring, urgent, informative, etc.)`,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment_score: {
            type: "number",
            minimum: -1,
            maximum: 1
          },
          emotional_state: {
            type: "string"
          },
          urgency_indicators: {
            type: "array",
            items: { type: "string" }
          },
          hidden_concerns: {
            type: "array",
            items: { type: "string" }
          },
          keywords: {
            type: "array",
            items: { type: "string" }
          },
          suggested_tone: {
            type: "string"
          }
        },
        required: ["sentiment_score", "emotional_state", "keywords"]
      }
    });

    return Response.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
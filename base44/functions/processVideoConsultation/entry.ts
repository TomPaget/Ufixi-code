import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { consultationId, chatMessages = [], audioTranscript = [], duration = 0 } = body;

    // Compile all consultation data for AI analysis
    const chatLog = chatMessages.map(msg => 
      `${msg.sender}: ${msg.message}`
    ).join('\n');

    const audioLog = audioTranscript.join('\n');

    const combinedContent = `
VIDEO CONSULTATION ANALYSIS
Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds

CHAT MESSAGES:
${chatLog || 'No chat messages'}

AUDIO TRANSCRIPT:
${audioLog || 'No audio transcript available'}

Please analyze this consultation and provide:
1. A concise summary (2-3 sentences)
2. Key points discussed (bullet list, 4-6 points)
3. Action items with assigned responsibilities and priority levels (high/medium/low)
4. Any cost estimates mentioned
5. Follow-up recommendations
`;

    // Use AI to extract insights
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: combinedContent,
      response_json_schema: {
        type: "object",
        properties: {
          transcript: { 
            type: "string",
            description: "Concise summary of the consultation"
          },
          keyPoints: { 
            type: "array", 
            items: { type: "string" },
            description: "List of key discussion points"
          },
          actionItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                assigned_to: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high"] }
              },
              required: ["task", "assigned_to", "priority"]
            },
            description: "Action items with assignments"
          },
          estimatedCost: {
            type: "number",
            description: "Cost estimate discussed, if any"
          },
          followUpRecommendations: {
            type: "array",
            items: { type: "string" },
            description: "Recommendations for next steps"
          }
        },
        required: ["transcript", "keyPoints", "actionItems"]
      }
    });

    return Response.json(analysis);

  } catch (error) {
    console.error('Video consultation processing error:', error);
    return Response.json({ 
      error: error.message,
      transcript: "Error processing consultation",
      keyPoints: [],
      actionItems: []
    }, { status: 500 });
  }
});
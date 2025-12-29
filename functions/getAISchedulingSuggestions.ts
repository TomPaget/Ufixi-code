import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tradespersonId, proposedDate, duration, notes } = await req.json();

    // Get tradesperson's existing bookings and time blocks
    const existingBookings = await base44.asServiceRole.entities.Booking.filter({
      tradesperson_id: tradespersonId,
      status: { $in: ['accepted', 'confirmed'] }
    });

    const timeBlocks = await base44.asServiceRole.entities.TimeBlock.filter({
      tradesperson_id: tradespersonId
    });

    // Analyze with AI
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI scheduling assistant helping coordinate appointments between customers and tradespeople.

**CUSTOMER REQUEST:**
- Proposed Date/Time: ${proposedDate ? new Date(proposedDate).toLocaleString() : 'Not specified'}
- Estimated Duration: ${duration} hours
- Special Requirements: ${notes || 'None'}

**TRADESPERSON'S SCHEDULE:**
Existing Bookings:
${existingBookings.map(b => `- ${new Date(b.confirmed_date || b.proposed_date).toLocaleString()} (${b.estimated_duration}hrs)`).join('\n') || 'No existing bookings'}

Blocked Time:
${timeBlocks.map(t => `- ${new Date(t.start_time).toLocaleString()} to ${new Date(t.end_time).toLocaleString()} (${t.type})`).join('\n') || 'No blocked time'}

**YOUR TASK:**
Provide 3-5 intelligent scheduling suggestions that:
1. Check if the proposed time is available
2. Consider optimal scheduling (avoiding back-to-back jobs, allowing travel time)
3. Suggest alternative times if conflicts exist
4. Account for typical working hours (8am-6pm weekdays)
5. Consider the tradesperson's workload balance
6. Factor in the job duration and any special requirements

**FORMAT YOUR RESPONSE AS:**
Return ONLY an array of practical, actionable suggestions. Each suggestion should be specific and helpful.

Example good suggestions:
- "Proposed time is available - no conflicts detected"
- "Wednesday 2-4pm works better - gives 1hr buffer after morning job"
- "Suggest morning slot (9-11am) - tradesperson typically has higher availability then"
- "Weekend may have premium rates - confirm pricing with tradesperson"
- "Consider 3-day weather forecast if outdoor work - rain expected Tuesday"`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: { type: "string" }
          },
          conflicts: {
            type: "array",
            items: { type: "string" }
          },
          optimal_times: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start: { type: "string" },
                end: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        },
        required: ["suggestions"]
      }
    });

    return Response.json({
      success: true,
      suggestions: analysis.suggestions || [],
      conflicts: analysis.conflicts || [],
      optimal_times: analysis.optimal_times || []
    });

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return Response.json({ 
      error: error.message,
      suggestions: ['Unable to generate suggestions at this time']
    }, { status: 500 });
  }
});
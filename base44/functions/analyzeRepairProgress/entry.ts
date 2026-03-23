import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId, stepNumber, mediaUrl, mediaType, userNotes } = await req.json();

    // Get the issue details
    const issues = await base44.entities.Issue.filter({ id: issueId });
    if (issues.length === 0) {
      return Response.json({ error: 'Issue not found' }, { status: 404 });
    }

    const issue = issues[0];
    const diySteps = issue.diy_steps || [];
    const currentStep = diySteps[stepNumber - 1] || "Unknown step";

    // Analyze the repair progress
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert tradesperson providing feedback on a DIY repair in progress.

REPAIR CONTEXT:
Issue: ${issue.title}
Description: ${issue.explanation}
Current Step (${stepNumber}): ${currentStep}
User's Notes: ${userNotes || "No notes provided"}

The user has submitted a ${mediaType} showing their progress on this step.

ANALYZE THE ${mediaType.toUpperCase()} AND PROVIDE:

1. **Quality Assessment (0-100):**
   - How well is the work executed so far?
   - Is it aligned with professional standards?
   - Rate: 80-100 = Excellent, 60-79 = Good, 40-59 = Needs improvement, 0-39 = Poor

2. **Detailed Feedback:**
   - What they're doing right
   - What looks good about their technique
   - Any positive observations

3. **Safety Warnings (if applicable):**
   - Any immediate safety concerns visible
   - Hazards they should be aware of
   - Protective measures they should take

4. **Improvement Suggestions:**
   - Specific things to adjust or improve
   - Better techniques they could use
   - Common mistakes to avoid
   - What to focus on for next steps

Be encouraging but honest. If something is dangerous, say so clearly. If they're doing well, praise them.`,
      file_urls: [mediaUrl],
      response_json_schema: {
        type: "object",
        properties: {
          qualityScore: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Overall quality score of the work"
          },
          feedback: {
            type: "string",
            description: "Detailed, encouraging feedback on their progress"
          },
          warnings: {
            type: "array",
            items: { type: "string" },
            description: "Any safety or quality warnings"
          },
          suggestions: {
            type: "array",
            items: { type: "string" },
            description: "Specific improvement suggestions"
          },
          nextStepAdvice: {
            type: "string",
            description: "Advice for proceeding to the next step"
          }
        },
        required: ["qualityScore", "feedback"]
      }
    });

    return Response.json(analysis);

  } catch (error) {
    console.error('Repair progress analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
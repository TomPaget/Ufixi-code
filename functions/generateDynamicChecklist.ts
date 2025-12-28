import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId, repairType } = await req.json();

    if (!issueId || !repairType) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const issues = await base44.entities.Issue.filter({ id: issueId });
    const issue = issues[0];

    if (!issue || issue.created_by !== user.email) {
      return Response.json({ error: 'Issue not found or access denied' }, { status: 403 });
    }

    const userSkillLevel = user.diy_skill_level || 'beginner';
    const isDIY = repairType === 'diy';

    const checklist = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Generate a comprehensive ${isDIY ? 'DIY' : 'professional oversight'} checklist for this home repair issue.

ISSUE: ${issue.title}
DESCRIPTION: ${issue.explanation}
SEVERITY: ${issue.severity_score}/10
TRADE TYPE: ${issue.trade_type}
USER SKILL LEVEL: ${userSkillLevel}
SAFETY WARNINGS: ${issue.safety_warnings?.join(', ') || 'None'}

${isDIY ? `
DIY CHECKLIST REQUIREMENTS:
- Adapt complexity to ${userSkillLevel} skill level
- Include pre-work preparation steps
- Add safety checkpoints before risky operations
- Provide verification questions for each step
- Include "STOP if..." conditions
- Add tool/material gathering phase
- Include cleanup and testing steps
` : `
PROFESSIONAL OVERSIGHT CHECKLIST:
- Pre-work contractor verification
- Cost/quote documentation
- Work permit requirements (if applicable)
- Progress milestone checks
- Quality inspection points
- Payment milestone tracking
- Warranty/guarantee documentation
`}

For each step provide:
1. Clear action description
2. Estimated time
3. Safety level (safe/caution/danger)
4. Verification question to confirm completion
5. Warning conditions when to stop
6. Required skill level (if applicable)

Create ${isDIY ? '8-15' : '5-10'} logical steps covering the entire repair process.`,
      response_json_schema: {
        type: "object",
        properties: {
          checklist_title: { type: "string" },
          estimated_total_time: { type: "string" },
          difficulty_rating: { 
            type: "string",
            enum: ["beginner", "intermediate", "advanced", "expert"]
          },
          phases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase_name: { type: "string" },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      step_number: { type: "number" },
                      title: { type: "string" },
                      description: { type: "string" },
                      estimated_time_minutes: { type: "number" },
                      safety_level: {
                        type: "string",
                        enum: ["safe", "caution", "danger"]
                      },
                      verification_question: { type: "string" },
                      stop_conditions: {
                        type: "array",
                        items: { type: "string" }
                      },
                      tips: {
                        type: "array",
                        items: { type: "string" }
                      },
                      required_skill: { type: "string" }
                    },
                    required: ["step_number", "title", "description", "safety_level"]
                  }
                }
              },
              required: ["phase_name", "steps"]
            }
          },
          critical_safety_notes: {
            type: "array",
            items: { type: "string" }
          },
          completion_verification: {
            type: "object",
            properties: {
              final_checks: {
                type: "array",
                items: { type: "string" }
              },
              success_indicators: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        },
        required: ["checklist_title", "phases"]
      }
    });

    return Response.json({
      success: true,
      repair_type: repairType,
      user_skill_level: userSkillLevel,
      ...checklist
    });

  } catch (error) {
    return Response.json({ 
      error: 'Checklist generation failed' 
    }, { status: 500 });
  }
});
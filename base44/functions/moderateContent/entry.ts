import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, image_url, type } = await req.json();

    // Use AI to moderate content
    const moderationResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a content moderator for a home maintenance community forum.

Analyze this ${type} content and determine if it contains:
1. Profanity or offensive language
2. Personal information including:
   - Phone numbers (any format)
   - Email addresses
   - Physical addresses or detailed location information
   - Full postal addresses or postcodes with street names
3. Website links or URLs (http://, https://, www., .com, .co.uk, etc.)
4. Inappropriate or explicit content
5. Spam or promotional content
6. Harassment or bullying

CRITICAL: Reject content if it contains ANY personal contact details (phone, email, address) or website links.

Content to moderate:
${content}

${image_url ? `Image URL provided: ${image_url}` : ''}

Respond with a moderation decision. Be strict about personal information and website links.`,
      ...(image_url ? { file_urls: [image_url] } : {}),
      response_json_schema: {
        type: "object",
        properties: {
          approved: { 
            type: "boolean",
            description: "Whether content is approved"
          },
          reason: { 
            type: "string",
            description: "Reason if rejected"
          },
          severity: {
            type: "string",
            enum: ["none", "low", "medium", "high"],
            description: "Severity of violation"
          },
          flagged_issues: {
            type: "array",
            items: { type: "string" },
            description: "List of issues found"
          }
        },
        required: ["approved", "severity"]
      }
    });

    return Response.json({
      approved: moderationResult.approved,
      reason: moderationResult.reason,
      severity: moderationResult.severity,
      flagged_issues: moderationResult.flagged_issues || []
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
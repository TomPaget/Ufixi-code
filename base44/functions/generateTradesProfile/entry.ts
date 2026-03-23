import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      businessName, 
      specialties, 
      yearsOperated, 
      location,
      serviceArea,
      existingBio,
      certifications
    } = await req.json();

    // AI-powered profile generation
    const profileGeneration = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a compelling professional profile for a tradesperson joining a home services platform.

TRADESPERSON DETAILS:
- Business Name: ${businessName}
- Specialties: ${specialties?.join(', ') || 'General trades'}
- Years Operating: ${yearsOperated || 'New business'}
- Location: ${location}
- Service Area: ${serviceArea}
- Certifications: ${certifications?.join(', ') || 'Standard insurance'}
${existingBio ? `- Current Bio: ${existingBio}` : ''}

TASK:
Create a professional, trustworthy profile that will attract customers. Include:

1. **Professional Bio** (3-4 paragraphs):
   - Opening: What makes them stand out
   - Experience: Years of operation, expertise areas, notable projects
   - Certifications: Highlight credentials and safety standards
   - Customer promise: Reliability, quality guarantee, communication
   
2. **Service Highlights** (5-7 bullet points):
   - Specific services offered
   - What they excel at
   - Unique selling points
   
3. **Recommended Service Area Description**:
   - Professional way to describe their coverage
   - Include travel policy if relevant
   
4. **Suggested Hourly Rate Range** (in GBP):
   - Based on specialty, experience, location
   - Industry-standard competitive pricing
   
5. **Availability Recommendations**:
   - Typical working hours
   - Emergency service capability
   - Booking lead time

6. **Professional Summary** (1-2 sentences):
   - Elevator pitch for search results
   
TONE: Professional, trustworthy, approachable, customer-focused
STYLE: Clear, confident, specific (avoid generic claims)`,
      response_json_schema: {
        type: "object",
        properties: {
          professional_bio: { type: "string" },
          service_highlights: {
            type: "array",
            items: { type: "string" }
          },
          service_area_description: { type: "string" },
          suggested_hourly_rate_min: { type: "number" },
          suggested_hourly_rate_max: { type: "number" },
          availability_notes: { type: "string" },
          professional_summary: { type: "string" },
          recommended_services: {
            type: "array",
            items: { type: "string" }
          },
          key_differentiators: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["professional_bio", "service_highlights", "professional_summary"]
      }
    });

    // Generate suggested keywords for SEO
    const seoAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate SEO keywords for this tradesperson profile:
      
Specialties: ${specialties?.join(', ')}
Location: ${location}

Provide 10-15 relevant search keywords customers might use.`,
      response_json_schema: {
        type: "object",
        properties: {
          keywords: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      ...profileGeneration,
      seo_keywords: seoAnalysis.keywords
    });

  } catch (error) {
    return Response.json({ 
      error: 'Profile generation failed' 
    }, { status: 500 });
  }
});
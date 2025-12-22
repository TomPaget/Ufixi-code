import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobDetails, jobId } = await req.json();
    
    // Fetch all verified tradespeople
    const tradespeople = await base44.asServiceRole.entities.User.filter({
      account_type: 'trades',
      trades_verified: true
    });

    if (tradespeople.length === 0) {
      return Response.json({ matches: [] });
    }

    // Fetch testimonials for all tradespeople
    const allTestimonials = await base44.asServiceRole.entities.Testimonial.filter({
      moderation_status: 'approved'
    });

    // Prepare tradesperson profiles with ratings
    const tradespeopleProfiles = tradespeople.map(tp => {
      const reviews = allTestimonials.filter(t => t.tradesperson_id === tp.id);
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      return {
        id: tp.id,
        name: tp.trades_business_name || tp.full_name,
        specialty: tp.trades_specialty,
        specialties: tp.trades_specialties || [],
        postcode: tp.postcode,
        hourly_rate: tp.trades_hourly_rate,
        years_experience: tp.trades_years_experience,
        rating: avgRating,
        review_count: reviews.length,
        bio: tp.trades_bio,
        availability: tp.trades_availability,
        service_radius: tp.trades_service_radius || 10
      };
    });

    // Use AI to match and rank tradespeople
    const matching = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert job-matching AI system that connects customers with the best tradespeople.

CUSTOMER JOB REQUEST:
Title: ${jobDetails.title}
Description: ${jobDetails.description}
Trade Type: ${jobDetails.trade_type}
Budget: £${jobDetails.budget_min || 0} - £${jobDetails.budget_max || 'flexible'}
Location: ${user.postcode || 'Not specified'}
Urgency: ${jobDetails.urgency || 'medium'}

AVAILABLE TRADESPEOPLE (${tradespeopleProfiles.length}):
${JSON.stringify(tradespeopleProfiles, null, 2)}

MATCHING CRITERIA (in order of importance):
1. SPECIALTY MATCH: Does their trade specialty match the job type? (Critical - reject if no match)
2. LOCATION: Are they within service radius of customer? (Use postcode for distance estimate)
3. PRICE FIT: Does their hourly rate fit customer's budget?
4. AVAILABILITY: Can they take on work now?
5. REPUTATION: Higher ratings and more reviews = better
6. EXPERIENCE: More years = better for complex jobs

MATCHING ALGORITHM:
For each tradesperson, calculate:
- Match Score (0-100): Overall compatibility
- Specialty Match: "perfect", "good", "partial", or "none" (reject if none)
- Distance: Estimated miles (use UK geography knowledge)
- Price Compatibility: "under_budget", "in_budget", "over_budget"
- Recommendation Reason: 2-3 sentence explanation of why they're a good fit

Return TOP 5 best matches only, sorted by match_score (highest first).

IMPORTANT:
- Only include tradespeople with specialty_match !== "none"
- Prioritize exact specialty matches
- Consider budget constraints seriously
- Factor in reputation heavily for high-value jobs
- For urgent jobs, prioritize availability`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tradesperson_id: { type: "string" },
                tradesperson_name: { type: "string" },
                match_score: { 
                  type: "number",
                  minimum: 0,
                  maximum: 100
                },
                specialty_match: {
                  type: "string",
                  enum: ["perfect", "good", "partial"]
                },
                distance_miles: { type: "number" },
                price_compatibility: {
                  type: "string",
                  enum: ["under_budget", "in_budget", "over_budget"]
                },
                recommendation_reason: { type: "string" },
                estimated_hourly_rate: { type: "number" },
                rating: { type: "number" },
                review_count: { type: "number" },
                years_experience: { type: "number" }
              },
              required: ["tradesperson_id", "match_score", "recommendation_reason"]
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      matches: matching.matches || [],
      total_considered: tradespeopleProfiles.length
    });

  } catch (error) {
    console.error('Matching failed:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
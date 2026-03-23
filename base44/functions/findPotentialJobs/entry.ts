import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.account_type !== 'trades') {
      return Response.json({ error: 'Trades account required' }, { status: 401 });
    }

    // Fetch open job postings
    const jobPostings = await base44.asServiceRole.entities.JobPosting.filter({
      status: 'open'
    });

    if (jobPostings.length === 0) {
      return Response.json({ potential_jobs: [] });
    }

    // Fetch customer profiles for each job
    const jobsWithCustomers = await Promise.all(
      jobPostings.map(async (job) => {
        const customers = await base44.asServiceRole.entities.User.filter({
          id: job.customer_id
        });
        return {
          ...job,
          customer_postcode: customers[0]?.postcode,
          customer_name: customers[0]?.full_name || job.customer_name
        };
      })
    );

    // Use AI to rank jobs by suitability
    const matching = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an AI job recommendation system helping tradespeople find the best opportunities.

TRADESPERSON PROFILE:
Name: ${user.trades_business_name || user.full_name}
Primary Specialty: ${user.trades_specialty}
All Specialties: ${user.trades_specialties?.join(', ') || user.trades_specialty}
Location: ${user.postcode}
Service Radius: ${user.trades_service_radius || 10} miles
Hourly Rate: £${user.trades_hourly_rate || 'Not set'}
Years Experience: ${user.trades_years_experience || 'Not specified'}
Availability: ${user.trades_availability || 'flexible'}

AVAILABLE JOBS (${jobsWithCustomers.length}):
${JSON.stringify(jobsWithCustomers, null, 2)}

MATCHING CRITERIA:
1. SPECIALTY ALIGNMENT: Does the job match their trade expertise? (Must match!)
2. LOCATION FIT: Is the job within their service radius?
3. PRICE ALIGNMENT: Does their rate fit the customer's budget?
4. URGENCY MATCH: Can they meet the urgency requirements?
5. PROJECT FIT: Does the job suit their experience level?

SCORING ALGORITHM:
For each job, calculate:
- Suitability Score (0-100): Overall fit for this tradesperson
- Match Reason: Why this job is perfect for them (2-3 sentences)
- Distance: Estimated miles from their location
- Budget Fit: "matches_rate", "above_rate", "below_rate"
- Urgency: Job urgency level
- Estimated Earnings: Based on their rate and job scope

Return TOP 10 best opportunities, sorted by suitability_score (highest first).

FILTERS:
- Only include jobs where trade_type matches one of their specialties
- Exclude jobs outside their service radius
- Prioritize jobs that match their availability`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          potential_jobs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                job_id: { type: "string" },
                job_title: { type: "string" },
                customer_name: { type: "string" },
                suitability_score: {
                  type: "number",
                  minimum: 0,
                  maximum: 100
                },
                match_reason: { type: "string" },
                distance_miles: { type: "number" },
                budget_min: { type: "number" },
                budget_max: { type: "number" },
                budget_fit: {
                  type: "string",
                  enum: ["matches_rate", "above_rate", "below_rate"]
                },
                urgency: { type: "string" },
                estimated_earnings: { type: "string" }
              },
              required: ["job_id", "suitability_score", "match_reason"]
            }
          }
        }
      }
    });

    return Response.json({
      success: true,
      potential_jobs: matching.potential_jobs || [],
      total_jobs_available: jobsWithCustomers.length
    });

  } catch (error) {
    console.error('Job finding failed:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issueId } = await req.json();

    if (!issueId) {
      return Response.json({ error: 'Issue ID required' }, { status: 400 });
    }

    // Get the issue
    const issues = await base44.entities.Issue.filter({ id: issueId });
    const issue = issues[0];

    if (!issue || issue.created_by !== user.email) {
      return Response.json({ error: 'Issue not found or access denied' }, { status: 403 });
    }

    // Get historical cost data for similar issues
    const historicalIssues = await base44.asServiceRole.entities.Issue.filter({
      trade_type: issue.trade_type,
      status: 'resolved'
    }, '-updated_date', 100);

    const historicalCosts = historicalIssues
      .filter(i => i.actual_diy_cost || i.actual_professional_cost)
      .map(i => ({
        diy: i.actual_diy_cost,
        professional: i.actual_professional_cost,
        location: i.user_location,
        title: i.title
      }));

    // Determine user's location and currency
    const userLocation = user.postcode || user.country || 'UK';
    const userCurrency = user.currency || 'GBP';
    const currencySymbol = { GBP: '£', USD: '$', EUR: '€' }[userCurrency] || '£';

    // Regional cost adjustment factors
    const regionalFactors = {
      'london': 1.35,
      'southeast': 1.2,
      'southwest': 1.1,
      'midlands': 1.0,
      'north': 0.9,
      'scotland': 0.95,
      'wales': 0.9,
      'northern ireland': 0.85,
      'us': 1.3,
      'europe': 1.15
    };

    const locationLower = userLocation.toLowerCase();
    let regionalMultiplier = 1.0;
    for (const [region, factor] of Object.entries(regionalFactors)) {
      if (locationLower.includes(region)) {
        regionalMultiplier = factor;
        break;
      }
    }

    // AI-powered detailed cost analysis
    const costAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a cost estimation expert for home repairs in ${userLocation}, providing detailed financial analysis.

ISSUE DETAILS:
- Title: ${issue.title}
- Description: ${issue.explanation}
- Trade Type: ${issue.trade_type}
- Severity: ${issue.severity_score}/10
- Urgency: ${issue.urgency}
- Location: ${userLocation}
- Currency: ${userCurrency}
- Regional Cost Multiplier: ${regionalMultiplier}x

HISTORICAL COST DATA:
${historicalCosts.length > 0 ? JSON.stringify(historicalCosts, null, 2) : 'No historical data available'}

TASK:
Provide a comprehensive cost breakdown for both DIY and Professional repair options:

DIY COSTS should include:
1. Materials/parts with specific items and individual costs
2. Tools needed (if not commonly owned) with purchase/rental costs
3. Consumables (screws, tape, sealant, etc.)
4. Safety equipment (if needed)
5. Estimated time investment (your labor is free, but time has value)
6. Difficulty multiplier (simple = 1x, moderate = 1.2x, complex = 1.5x)

PROFESSIONAL COSTS should include:
1. Labor costs (typical hourly rate for ${issue.trade_type} in ${userLocation})
2. Callout/diagnostic fee
3. Materials markup (typically 15-30% above retail)
4. Emergency surcharge (if urgency = fix_now)
5. VAT/Tax (20% UK, adjust for location)
6. Travel/parking fees (if applicable)

ANALYSIS REQUIREMENTS:
- Use ${currencySymbol} for all amounts
- Apply regional multiplier: ${regionalMultiplier}x
- Consider current ${new Date().getFullYear()} market rates
- Factor in supply chain costs if relevant
- Weekend/evening rates if urgent
- Account for job complexity

Provide realistic ranges (min-max) not just single estimates.`,
      response_json_schema: {
        type: "object",
        properties: {
          diy_breakdown: {
            type: "object",
            properties: {
              materials: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    item: { type: "string" },
                    cost_min: { type: "number" },
                    cost_max: { type: "number" },
                    notes: { type: "string" }
                  }
                }
              },
              tools: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tool: { type: "string" },
                    cost: { type: "number" },
                    rental_option: { type: "boolean" },
                    rental_cost: { type: "number" }
                  }
                }
              },
              total_min: { type: "number" },
              total_max: { type: "number" },
              time_hours: { type: "number" },
              difficulty_level: { type: "string" }
            },
            required: ["materials", "total_min", "total_max"]
          },
          professional_breakdown: {
            type: "object",
            properties: {
              labor_cost_min: { type: "number" },
              labor_cost_max: { type: "number" },
              labor_hours: { type: "number" },
              callout_fee: { type: "number" },
              materials_cost_min: { type: "number" },
              materials_cost_max: { type: "number" },
              tax_vat: { type: "number" },
              total_min: { type: "number" },
              total_max: { type: "number" },
              typical_duration_days: { type: "number" }
            },
            required: ["labor_cost_min", "labor_cost_max", "total_min", "total_max"]
          },
          optimal_recommendation: {
            type: "object",
            properties: {
              choice: { type: "string", enum: ["diy", "professional", "hybrid"] },
              reasoning: { type: "string" },
              cost_savings: { type: "number" },
              risk_factors: {
                type: "array",
                items: { type: "string" }
              },
              money_saving_tips: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["choice", "reasoning"]
          },
          cost_comparison: {
            type: "object",
            properties: {
              diy_vs_pro_savings_percent: { type: "number" },
              breakeven_point: { type: "string" },
              hidden_costs_warning: { type: "string" }
            }
          }
        },
        required: ["diy_breakdown", "professional_breakdown", "optimal_recommendation"]
      }
    });

    return Response.json({
      success: true,
      currency: userCurrency,
      currency_symbol: currencySymbol,
      location: userLocation,
      regional_multiplier: regionalMultiplier,
      historical_data_points: historicalCosts.length,
      ...costAnalysis
    });

  } catch (error) {
    return Response.json({ 
      error: 'Cost calculation failed' 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tradespersonId } = await req.json();

    if (!tradespersonId) {
      return Response.json({ error: 'tradespersonId required' }, { status: 400 });
    }

    // Authorization: Only the tradesperson themselves or admins can recalculate
    if (user.id !== tradespersonId && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Can only calculate your own trust score' }, { status: 403 });
    }

    // Get tradesperson info
    const tradesperson = await base44.asServiceRole.entities.User.filter({ 
      id: tradespersonId 
    });

    if (tradesperson.length === 0) {
      return Response.json({ error: 'Tradesperson not found' }, { status: 404 });
    }

    const user = tradesperson[0];

    // 1. Get all reviews for this tradesperson
    const reviews = await base44.asServiceRole.entities.DetailedReview.filter({
      tradesperson_id: tradespersonId,
      moderation_status: "approved"
    });

    // 2. Get all conversations where they're participant
    const conversations = await base44.asServiceRole.entities.Conversation.filter({
      participant_2_id: tradespersonId
    });

    // 3. Analyze messages for communication quality
    let totalMessages = 0;
    let responseTimes = [];
    let communicationSamples = [];

    for (const convo of conversations) {
      const messages = await base44.asServiceRole.entities.Message.filter({
        conversation_id: convo.id
      });

      const tradesMessages = messages.filter(m => m.sender_id === tradespersonId);
      totalMessages += tradesMessages.length;

      // Calculate response times
      for (let i = 1; i < messages.length; i++) {
        if (messages[i].sender_id === tradespersonId && 
            messages[i-1].sender_id !== tradespersonId) {
          const responseTime = new Date(messages[i].created_date) - new Date(messages[i-1].created_date);
          responseTimes.push(responseTime / (1000 * 60 * 60)); // Convert to hours
        }
      }

      // Collect message samples for AI analysis (last 20 messages)
      communicationSamples.push(...tradesMessages.slice(-20).map(m => m.content));
    }

    // 4. AI Analysis of Communication Style
    let professionalismScore = 70; // Default
    let communicationQuality = 70;

    if (communicationSamples.length > 5) {
      const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analyze these messages from a tradesperson to assess their professionalism and communication quality.

Messages:
${communicationSamples.slice(0, 30).join('\n---\n')}

Rate the following on a scale of 0-100:
1. **Professionalism**: Courteous, respectful, clear language, proper grammar
2. **Helpfulness**: Proactive, informative, addresses concerns
3. **Clarity**: Easy to understand, specific, well-explained
4. **Responsiveness**: Engaging, prompt acknowledgment

Consider:
- Tone and courtesy
- Grammar and spelling
- Clarity of explanations
- Problem-solving approach
- Customer service quality

Be objective and realistic. Most professionals score 60-80. Only exceptional ones get 80+.`,
        response_json_schema: {
          type: "object",
          properties: {
            professionalism_score: { type: "number", minimum: 0, maximum: 100 },
            helpfulness_score: { type: "number", minimum: 0, maximum: 100 },
            clarity_score: { type: "number", minimum: 0, maximum: 100 },
            responsiveness_perception: { type: "number", minimum: 0, maximum: 100 },
            overall_communication: { type: "number", minimum: 0, maximum: 100 },
            strengths: { type: "array", items: { type: "string" } },
            areas_for_improvement: { type: "array", items: { type: "string" } }
          },
          required: ["professionalism_score", "overall_communication"]
        }
      });

      professionalismScore = aiAnalysis.professionalism_score;
      communicationQuality = aiAnalysis.overall_communication;
    }

    // 5. Calculate responsiveness score from response times
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 24;

    let responsivenessScore = 50;
    if (avgResponseTime < 1) responsivenessScore = 95;
    else if (avgResponseTime < 2) responsivenessScore = 90;
    else if (avgResponseTime < 4) responsivenessScore = 80;
    else if (avgResponseTime < 8) responsivenessScore = 70;
    else if (avgResponseTime < 24) responsivenessScore = 60;
    else responsivenessScore = 40;

    // 6. Calculate reliability from completed jobs
    const completedJobs = await base44.asServiceRole.entities.Job.filter({
      tradesperson_id: tradespersonId,
      status: "completed"
    });

    const allJobs = await base44.asServiceRole.entities.Job.filter({
      tradesperson_id: tradespersonId
    });

    const completionRate = allJobs.length > 0 
      ? (completedJobs.length / allJobs.length) * 100 
      : 70;

    const reliabilityScore = Math.min(completionRate, 100);

    // 7. Calculate review score
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
      : 3.5;

    const reviewScore = (avgRating / 5) * 100;

    // Calculate detailed category scores
    const qualityScore = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.quality_rating || r.overall_rating), 0) / reviews.length / 5) * 100
      : 70;

    const timelinessScore = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.timeliness_rating || r.overall_rating), 0) / reviews.length / 5) * 100
      : 70;

    const valueScore = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.value_rating || r.overall_rating), 0) / reviews.length / 5) * 100
      : 70;

    // 8. Calculate weighted Trust Score
    const trustScore = Math.round(
      (reviewScore * 0.30) +           // 30% reviews
      (professionalismScore * 0.25) +  // 25% professionalism
      (responsivenessScore * 0.20) +   // 20% responsiveness
      (reliabilityScore * 0.15) +      // 15% reliability
      (communicationQuality * 0.10)    // 10% communication
    );

    // 9. Update tradesperson record
    await base44.asServiceRole.entities.User.update(tradespersonId, {
      trust_score: trustScore,
      professionalism_score: Math.round(professionalismScore),
      responsiveness_score: Math.round(responsivenessScore),
      reliability_score: Math.round(reliabilityScore),
      total_reviews: reviews.length,
      average_rating: parseFloat(avgRating.toFixed(2)),
      avg_response_time: avgResponseTime < 1 ? "< 1 hour" : 
                        avgResponseTime < 2 ? "1-2 hours" :
                        avgResponseTime < 4 ? "2-4 hours" :
                        avgResponseTime < 8 ? "4-8 hours" : 
                        avgResponseTime < 24 ? "< 24 hours" : "> 1 day",
      last_trust_score_update: new Date().toISOString()
    });

    return Response.json({
      success: true,
      trust_score: trustScore,
      breakdown: {
        reviews: { score: Math.round(reviewScore), weight: "30%", count: reviews.length },
        professionalism: { score: Math.round(professionalismScore), weight: "25%" },
        responsiveness: { score: Math.round(responsivenessScore), weight: "20%", avgResponseTime: `${avgResponseTime.toFixed(1)}h` },
        reliability: { score: Math.round(reliabilityScore), weight: "15%", completionRate: `${completionRate.toFixed(0)}%` },
        communication: { score: Math.round(communicationQuality), weight: "10%" }
      },
      categoryScores: {
        quality: Math.round(qualityScore),
        timeliness: Math.round(timelinessScore),
        value: Math.round(valueScore)
      }
    });

  } catch (error) {
    console.error('Trust score calculation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
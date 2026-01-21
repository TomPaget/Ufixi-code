import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return Response.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    // Update user record
    await base44.asServiceRole.auth.updateUser(user.id, {
      subscription_cancelled: true,
      subscription_cancel_at: new Date(subscription.cancel_at * 1000).toISOString()
    });

    return Response.json({ 
      success: true,
      cancelAt: subscription.cancel_at 
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
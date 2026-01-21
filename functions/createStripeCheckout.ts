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

    const { planType, planName, price, accountType } = await req.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: planName,
              description: `${accountType === 'business' ? 'Business' : 'Trades'} Subscription`,
            },
            recurring: {
              interval: accountType === 'business' ? 'month' : 'week',
            },
            unit_amount: Math.round(price * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}${accountType === 'business' ? '/Home' : '/TradesSuccess'}`,
      cancel_url: `${req.headers.get('origin')}${accountType === 'business' ? '/BusinessPricing' : '/TradesPayment'}`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        account_type: accountType,
        plan_name: planName,
        plan_type: planType,
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
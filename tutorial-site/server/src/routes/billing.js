import { Router } from "express";
import Stripe from "stripe";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Creates a Stripe Checkout session for the Paid plan subscription.
// The client redirects the browser to session.url.
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    let customerId = req.user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId: req.user._id.toString() },
      });
      customerId = customer.id;
      req.user.stripeCustomerId = customerId;
      await req.user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/dashboard?upgraded=1`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      metadata: { userId: req.user._id.toString() },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not start checkout" });
  }
});

router.post("/create-portal-session", requireAuth, async (req, res) => {
  if (!req.user.stripeCustomerId) {
    return res.status(400).json({ error: "No billing account on file" });
  }
  const portal = await stripe.billingPortal.sessions.create({
    customer: req.user.stripeCustomerId,
    return_url: `${process.env.CLIENT_URL}/dashboard`,
  });
  res.json({ url: portal.url });
});

/**
 * Stripe webhook — the single source of truth for plan status.
 * Must be mounted with the raw body parser (see server/src/index.js),
 * not express.json(), or signature verification will fail.
 */
export async function stripeWebhookHandler(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          plan: "paid",
          stripeSubscriptionId: session.subscription,
        });
      }
      break;
    }
    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const isActive = sub.status === "active" || sub.status === "trialing";
      await User.findOneAndUpdate(
        { stripeSubscriptionId: sub.id },
        { plan: isActive ? "paid" : "free" }
      );
      break;
    }
    default:
      break; // ignore other event types
  }

  res.json({ received: true });
}

export default router;

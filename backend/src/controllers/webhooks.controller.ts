import type { Request, Response } from "express";
import { Webhook } from "svix";
import { DodoPayments } from "dodopayments";
import crypto from "crypto";
import { ensureUserExists } from "./users.controller.js";
import { supabase } from "../lib/supabase.js";

export async function handleClerkWebhook(req: Request, res: Response) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Get the headers
  const svix_id = req.headers["svix-id"] as string;
  const svix_timestamp = req.headers["svix-timestamp"] as string;
  const svix_signature = req.headers["svix-signature"] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: "Missing svix headers" });
  }

  // Get the body - it's already a Buffer from express.raw()
  const payload = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("Webhook verification error:", errorMessage);
    return res.status(400).json({ error: "Webhook verification failed", details: errorMessage });
  }

  // Handle the webhook
  const eventType = evt.type;
  const data = evt.data;

  console.log(`Webhook received: ${eventType}`, data.id);

  try {
    if (eventType === "user.created" || eventType === "user.updated") {
      // Sync user to Supabase
      await ensureUserExists(data.id, data);
      console.log(`User synced to Supabase: ${data.id}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error handling webhook:", errorMessage);
    return res.status(500).json({ error: "Error processing webhook", details: errorMessage });
  }
}

// Dodo Payments webhook handler
export async function handleDodoWebhook(req: Request, res: Response) {
  const WEBHOOK_KEY = process.env.DODO_PAYMENT_SECRET;

  if (!WEBHOOK_KEY) {
    console.error("[DodoWebhook] DODO_PAYMENT_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  try {
    const dodo = new DodoPayments({
      webhookKey: WEBHOOK_KEY,
    });

    // Get the headers as a record
    const headers: Record<string, string> = {};
    Object.keys(req.headers).forEach(key => {
      const val = req.headers[key];
      if (typeof val === 'string') headers[key] = val;
    });

    const payload = req.body instanceof Buffer ? req.body.toString() : JSON.stringify(req.body);

    let event: any;
    try {
      // Dodo SDK helper for verification and parsing
      event = dodo.webhooks.unwrap(payload, { headers });
    } catch (err) {
      console.error("[DodoWebhook] Invalid signature:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const eventType = event.event_type;
    const data = event.data;
    const metadata = data.metadata || {};
    const userId = metadata.user_id as string | undefined;

    if (!userId) {
      console.warn(`[DodoWebhook] No user_id in metadata for event: ${eventType}`);
      return res.status(200).json({ received: true, info: "No user_id found" });
    }

    console.log(`[DodoWebhook] Processing ${eventType} for user: ${userId}`);

    // Ensure user exists in our DB
    try {
      await ensureUserExists(userId);
    } catch (e: any) {
      console.warn(`[DodoWebhook] ensureUserExists check failed for ${userId}: ${e.message}`);
    }

    // Pro-granting events: simplified for Dodo's structure
    // payment.succeeded covers one-time, subscription.active covers recurring
    const isProEvent = [
      "payment.succeeded",
      "subscription.active",
    ].includes(eventType);

    // Revocation events
    const isRevokeEvent = [
      "subscription.cancelled",
      "subscription.expired",
      "payment.failed"
    ].includes(eventType);

    if (isProEvent || isRevokeEvent) {
      const proStatus = isProEvent;
      console.log(`[DodoWebhook] Updating Pro status to ${proStatus} for user ${userId} via ${eventType}`);

      const { error } = await supabase
        .from("users")
        .update({
          is_pro: proStatus,
          // Track Dodo specifics if available
          dodo_customer_id: data.customer?.customer_id || null,
          dodo_payment_id: data.payment_id || null,
          dodo_subscription_id: data.subscription_id || null
        })
        .eq("id", userId);

      if (error) {
        console.error(`[DodoWebhook] DB Update failed: ${error.message}`);
        // Fallback to just is_pro if columns are missing
        await supabase.from("users").update({ is_pro: proStatus }).eq("id", userId);
      }

      console.log(`[DodoWebhook] Success for user ${userId}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[DodoWebhook] Critical error:", message);
    return res.status(500).json({ error: "Error processing webhook", details: message });
  }
}



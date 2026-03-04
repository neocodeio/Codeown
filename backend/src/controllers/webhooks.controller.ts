import type { Request, Response } from "express";
import { Webhook } from "svix";
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

// Lemon Squeezy webhook handler
export async function handleLemonWebhook(req: Request, res: Response) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  try {
    const signature = (req.headers["x-signature"] ||
      req.headers["X-Signature"]) as string | undefined;

    if (!signature) {
      return res.status(400).json({ error: "Missing X-Signature header" });
    }

    const rawBody =
      req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (computed !== signature) {
      console.error("Invalid Lemon Squeezy webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventName = event.meta?.event_name as string | undefined;
    const customData = event.meta?.custom_data || {};
    const userId = customData.user_id as string | undefined;
    const attrs = event.data?.attributes || {};

    if (!eventName) {
      return res.status(400).json({ error: "Missing event name" });
    }

    if (!userId) {
      // Nothing to map back to our users table, but acknowledge so LS doesn't retry forever
      console.warn("Lemon webhook without user_id in custom_data", eventName);
      return res.status(200).json({ received: true });
    }

    // Build common update payload with optional tracking fields
    const baseUpdate: Record<string, unknown> = {
      lemon_customer_id: attrs.customer_id?.toString?.() ?? null,
      lemon_subscription_id: attrs.id?.toString?.() ?? null,
      lemon_subscription_status: attrs.status ?? null,
      lemon_variant_id: attrs.variant_id ?? null,
    };

    // Turn Pro on for successful / active subscription events
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_resumed" ||
      eventName === "subscription_payment_success"
    ) {
      const { error } = await supabase
        .from("users")
        .update({ ...baseUpdate, is_pro: true })
        .eq("id", userId);

      if (error) {
        console.error("Error updating user to pro:", error.message);
        return res.status(500).json({ error: "Failed to update user to pro" });
      }
    }

    // Turn Pro off for terminal / failed subscription events
    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired" ||
      eventName === "subscription_payment_failed"
    ) {
      const { error } = await supabase
        .from("users")
        .update({ ...baseUpdate, is_pro: false })
        .eq("id", userId);

      if (error) {
        console.error("Error downgrading user from pro:", error.message);
        return res.status(500).json({ error: "Failed to downgrade user" });
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error handling Lemon Squeezy webhook:", message);
    return res.status(500).json({ error: "Error processing webhook", details: message });
  }
}



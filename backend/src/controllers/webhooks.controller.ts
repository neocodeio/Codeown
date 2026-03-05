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
    console.error("[LemonWebhook] LEMONSQUEEZY_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  try {
    const signature = (req.headers["x-signature"] || req.headers["X-Signature"]) as string | undefined;

    if (!signature) {
      console.error("[LemonWebhook] Missing X-Signature header");
      return res.status(400).json({ error: "Missing X-Signature header" });
    }

    const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));

    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (computed !== signature) {
      console.error("[LemonWebhook] Invalid signature match");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventName = event.meta?.event_name as string | undefined;
    const customData = event.meta?.custom_data || {};
    const userId = (customData.user_id || customData.userId) as string | undefined;
    const attrs = event.data?.attributes || {};
    const objectType = event.data?.type as string | undefined;

    if (!eventName) {
      console.warn("[LemonWebhook] Missing event_name in payload");
      return res.status(400).json({ error: "Missing event name" });
    }

    if (!userId) {
      console.warn(`[LemonWebhook] No user_id in custom_data for event: ${eventName}. Available meta:`, JSON.stringify(event.meta));
      return res.status(200).json({ received: true, info: "No user_id found" });
    }

    console.log(`[LemonWebhook] Processing ${eventName} for user: ${userId}`);

    // Robust user check - ensure they exist in Supabase before updating
    try {
      await ensureUserExists(userId);
    } catch (e: any) {
      console.warn(`[LemonWebhook] ensureUserExists check failed for ${userId}: ${e.message}`);
    }

    // Extraction with fallbacks
    const objectId = event.data?.id?.toString() || attrs.id?.toString() || null;
    const baseUpdate: Record<string, any> = {
      lemon_customer_id: attrs.customer_id?.toString() || null,
      lemon_variant_id: attrs.variant_id?.toString() || null,
      lemon_subscription_status: attrs.status || (objectType === "orders" ? "paid" : null),
    };

    if (objectType === "subscriptions") {
      baseUpdate.lemon_subscription_id = objectId;
      baseUpdate.lemon_order_id = attrs.order_id?.toString() || null;
    } else if (objectType === "orders") {
      baseUpdate.lemon_order_id = objectId;
    }

    // Determine if we should grant Pro status
    const isProEvent = [
      "subscription_created",
      "subscription_resumed",
      "subscription_payment_success",
      "subscription_updated",
      "order_created"
    ].includes(eventName);

    const isDowngradeEvent = [
      "subscription_cancelled",
      "subscription_expired",
      "subscription_payment_failed"
    ].includes(eventName);

    if (isProEvent || isDowngradeEvent) {
      const proStatus = isProEvent;
      console.log(`[LemonWebhook] Updating Pro status to ${proStatus} for user ${userId}`);

      // Try full update first (includes metadata columns that might not exist yet)
      const { error: fullError } = await supabase
        .from("users")
        .update({ ...baseUpdate, is_pro: proStatus })
        .eq("id", userId);

      if (fullError) {
        console.warn(`[LemonWebhook] Full update failed (likely missing columns): ${fullError.message}. Retrying with is_pro only.`);

        // Fallback update: only is_pro which is guaranteed to exist
        const { error: fallbackError } = await supabase
          .from("users")
          .update({ is_pro: proStatus })
          .eq("id", userId);

        if (fallbackError) {
          console.error(`[LemonWebhook] Critical: Fallback update failed: ${fallbackError.message}`);
          return res.status(500).json({ error: "Database update failed" });
        }
      }

      console.log(`[LemonWebhook] Successfully processed ${eventName} for user ${userId}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[LemonWebhook] Critical error:", message);
    return res.status(500).json({ error: "Error processing webhook", details: message });
  }
}



import type { Request, Response } from "express";
import { Webhook } from "svix";
import { ensureUserExists } from "./users.controller.js";


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


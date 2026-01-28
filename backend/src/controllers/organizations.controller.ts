import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { sendOrgRegistrationNotification, sendOrgStatusUpdateEmail } from "../lib/email.js";

export async function registerOrganization(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const {
            name,
            website,
            domain_email,
            description,
            location,
            size,
            industry
        } = req.body;

        // Validate required fields
        if (!name || !domain_email) {
            return res.status(400).json({ error: "Company name and domain email are required." });
        }

        // Check if domain email is already registered
        const { data: existingOrg } = await supabase
            .from("organizations")
            .select("id")
            .eq("domain_email", domain_email)
            .single();

        if (existingOrg) {
            return res.status(400).json({ error: "Organization with this domain email already exists." });
        }

        // Create organization
        const { data: org, error } = await supabase
            .from("organizations")
            .insert({
                name,
                website,
                domain_email,
                description,
                location,
                size,
                industry,
                creator_id: userId,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating organization:", error);
            return res.status(500).json({ error: "Failed to create organization" });
        }

        // Update user to be linked to this organization (pending)
        await supabase
            .from("users")
            .update({ organization_id: org.id, is_organization: true })
            .eq("id", userId);

        // Send notification to admin (hardcoded for now, or use an env var)
        const adminEmail = process.env.ADMIN_EMAIL || "admin@codeown.space";
        sendOrgRegistrationNotification(adminEmail, org);

        return res.status(201).json(org);
    } catch (error: any) {
        console.error("Unexpected error in registerOrganization:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getOrganization(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { data: org, error } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        return res.json(org);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function updateOrganizationStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { status } = req.body; // pending, approved, rejected, suspended

        if (!['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const { data: org, error } = await supabase
            .from("organizations")
            .update({
                status,
                verified: status === 'approved',
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: "Failed to update status" });
        }

        // Notify the creator
        const { data: creator } = await supabase
            .from("users")
            .select("email")
            .eq("id", org.creator_id)
            .single();

        if (creator?.email) {
            sendOrgStatusUpdateEmail(creator.email, org.name, status);
        }

        return res.json(org);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function getMyOrganization(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { data: user } = await supabase
            .from("users")
            .select("organization_id")
            .eq("id", userId)
            .single();

        if (!user?.organization_id) {
            return res.status(404).json({ error: "No organization found for this user" });
        }

        const { data: org, error } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", user.organization_id)
            .single();

        if (error) return res.status(500).json({ error: "Failed to fetch organization" });

        return res.json(org);
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

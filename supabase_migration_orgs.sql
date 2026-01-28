-- Enum for organization status
DO $$ BEGIN
    CREATE TYPE organization_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    website TEXT,
    domain_email TEXT NOT NULL UNIQUE,
    description TEXT,
    location TEXT,
    size TEXT,
    industry TEXT,
    status organization_status DEFAULT 'pending',
    verified BOOLEAN DEFAULT false,
    creator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_organization BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Developer Discovery fields for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[]; -- Array of skills
ALTER TABLE users ADD COLUMN IF NOT EXISTS tech_stack TEXT[]; -- Array of techs
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_level TEXT; -- junior, mid, senior, lead
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hirable BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create integration_installations table
CREATE TABLE IF NOT EXISTS integration_installations (
    id VARCHAR(255) PRIMARY KEY,
    organization_id VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'github',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_installations_org_id
ON integration_installations(organization_id);

CREATE INDEX IF NOT EXISTS idx_integration_installations_provider
ON integration_installations(provider);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_integration_installations_updated_at ON integration_installations;
CREATE TRIGGER update_integration_installations_updated_at
    BEFORE UPDATE ON integration_installations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
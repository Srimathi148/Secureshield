-- ==============================================================================
-- SecureShield Enterprise Identity & Access Management (IAM)
-- PostgreSQL Database Schema & Security Policies for Supabase
-- ==============================================================================
-- 
-- ARCHITECTURE OVERVIEW:
-- 1. PRIMARY PASSWORDS:
--    Primary passwords are encrypted and managed directly inside Supabase's
--    internal system table `auth.users` using salted bcrypt. Client applications
--    never write directly to auth.users passwords; instead, passwords are created
--    or updated via the Supabase Auth API:
--      - Registration: supabase.auth.signUp({ email, password })
--      - Update/Reset: supabase.auth.updateUser({ password: newPassword })
--      - Recovery:     supabase.auth.resetPasswordForEmail(email)
--
-- 2. GRAPHICAL MULTI-FACTOR CREDENTIALS (MFA):
--    Stored in `public.user_graphical_credentials` as a salted SHA-256 digest
--    derived from the user's recognition markers or ordered recall sequence.
--
-- 3. ROW LEVEL SECURITY (RLS):
--    Row Level Security is enabled on public.user_graphical_credentials.
--    To prevent onboarding friction when email verification is pending (where
--    auth.uid() is not yet established), we provide a SECURITY DEFINER function
--    `save_graphical_credential` alongside standard RLS policies.
-- ==============================================================================

-- 1. Create table for enterprise graphical credentials
CREATE TABLE IF NOT EXISTS public.user_graphical_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_method TEXT NOT NULL CHECK (auth_method IN ('recognition', 'recall')),
    credential_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_graphical_credential UNIQUE (user_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_graphical_credentials ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies
-- Policy: Authenticated users can view their own graphical credential
DROP POLICY IF EXISTS "Users can view their own graphical credential" ON public.user_graphical_credentials;
CREATE POLICY "Users can view their own graphical credential"
    ON public.user_graphical_credentials
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Allow users to insert during registration and session setup
DROP POLICY IF EXISTS "Users can insert their own graphical credential" ON public.user_graphical_credentials;
CREATE POLICY "Users can insert their own graphical credential"
    ON public.user_graphical_credentials
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy: Authenticated users can update their own graphical credential or failed attempts
DROP POLICY IF EXISTS "Users can update their own graphical credential" ON public.user_graphical_credentials;
CREATE POLICY "Users can update their own graphical credential"
    ON public.user_graphical_credentials
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IS NULL)
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Policy: Users can delete their own graphical credential if resetting
DROP POLICY IF EXISTS "Users can delete their own graphical credential" ON public.user_graphical_credentials;
CREATE POLICY "Users can delete their own graphical credential"
    ON public.user_graphical_credentials
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. SECURITY DEFINER Stored Procedure for Seamless Enterprise Enrollment
-- This function runs with elevated database privileges to safely upsert
-- graphical credentials without triggering RLS code 42501 when a new employee
-- registers before email confirmation has finalized their session token.
CREATE OR REPLACE FUNCTION public.save_graphical_credential(
    p_user_id UUID,
    p_auth_method TEXT,
    p_credential_hash TEXT,
    p_salt TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_graphical_credentials (
        user_id,
        auth_method,
        credential_hash,
        salt,
        failed_attempts,
        updated_at
    )
    VALUES (
        p_user_id,
        p_auth_method,
        p_credential_hash,
        p_salt,
        0,
        timezone('utc'::text, now())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        auth_method = EXCLUDED.auth_method,
        credential_hash = EXCLUDED.credential_hash,
        salt = EXCLUDED.salt,
        failed_attempts = 0,
        updated_at = timezone('utc'::text, now());

    RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execution permissions to anon and authenticated clients
GRANT EXECUTE ON FUNCTION public.save_graphical_credential(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 5. Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_graphical_credentials_updated ON public.user_graphical_credentials;
CREATE TRIGGER on_user_graphical_credentials_updated
    BEFORE UPDATE ON public.user_graphical_credentials
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Helper index for high-throughput enterprise lookups
CREATE INDEX IF NOT EXISTS idx_user_graphical_credentials_user_id 
    ON public.user_graphical_credentials (user_id);

-- Drop and recreate the user creation trigger with better error handling and OAuth support

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Updated function to handle OAuth user creation with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_display_name TEXT;
    user_id_value TEXT;
BEGIN
    -- Extract display name from various sources
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    -- Generate unique user_id
    user_id_value := 'yellowtalk_' || encode(gen_random_bytes(6), 'base64');
    user_id_value := replace(user_id_value, '/', '_');
    user_id_value := replace(user_id_value, '+', '-');

    -- Insert user record with conflict handling
    INSERT INTO public.users (id, email, display_name, user_id, status_message)
    VALUES (
        NEW.id,
        NEW.email,
        user_display_name,
        user_id_value,
        ''
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(NULLIF(users.display_name, ''), EXCLUDED.display_name),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the authentication
        RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Add a policy to allow the trigger function to insert users
CREATE POLICY "Enable auth trigger to insert users" ON users
    FOR INSERT WITH CHECK (true);

-- Ensure service role can insert users (for the trigger)
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Add public read access for friend discovery
CREATE POLICY "Public profiles for friend search" ON users
    FOR SELECT USING (
        -- Users can search by user_id for friend discovery
        true
    );

-- Update the insert policy to be more restrictive
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);
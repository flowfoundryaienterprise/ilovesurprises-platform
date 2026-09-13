-- ==============================================================================
-- I Love Surprises - Customer Firebase Authentication Migration
-- Authoritative Schema Update for Customer Profile Linking
-- ==============================================================================

-- 1. Add firebase_uid column with unique index to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles(firebase_uid);

-- 2. Decouple profiles foreign key to auth.users so Firebase customer auth can store profiles
-- (Admin users remain connected to auth.users with their existing UUID)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Row Level Security policies for Customer Profile creation & updates
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read of profiles (for rep vanity handle lookups, sponsor upline verification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public profile select'
  ) THEN
    CREATE POLICY "Allow public profile select"
      ON public.profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow customer insert strictly for role = 'customer' (preventing client from creating admin profiles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow customer profile insert'
  ) THEN
    CREATE POLICY "Allow customer profile insert"
      ON public.profiles FOR INSERT
      WITH CHECK (role = 'customer');
  END IF;
END $$;

-- Allow customer profile updates strictly for role = 'customer'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow customer profile update'
  ) THEN
    CREATE POLICY "Allow customer profile update"
      ON public.profiles FOR UPDATE
      USING (true)
      WITH CHECK (role = 'customer');
  END IF;
END $$;

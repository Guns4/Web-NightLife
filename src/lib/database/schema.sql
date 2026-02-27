-- ============================================================
-- NightLife Indonesia Database Schema
-- Supabase PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

-- User roles
CREATE TYPE user_role AS ENUM ('guest', 'owner', 'admin');

-- Venue categories
CREATE TYPE venue_category AS ENUM ('club', 'karaoke', 'ktv', 'spa');

-- ============================================================
-- TABLE: profiles (Linked to Auth.Users)
-- ============================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'guest',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster profile lookups
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================
-- TABLE: venues (The Heart of the Platform)
-- ============================================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    category venue_category NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    address TEXT,
    coordinates GEOGRAPHY(POINT, 4326),
    price_range INT CHECK (price_range >= 1 AND price_range <= 4),
    rating FLOAT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    features TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_category ON venues(category);
CREATE INDEX idx_venues_price_range ON venues(price_range);
CREATE INDEX idx_venues_rating ON venues(rating DESC);
CREATE INDEX idx_venues_owner ON venues(owner_id);
CREATE INDEX idx_venues_active ON venues(is_active) WHERE is_active = true;

-- ============================================================
-- TABLE: promos (Real-time Transparency)
-- ============================================================
CREATE TABLE promos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_value NUMERIC(10, 2),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    day_of_week INT[] DEFAULT '{}',  -- 0=Sunday, 1=Monday, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for promo queries
CREATE INDEX idx_promos_venue ON promos(venue_id);
CREATE INDEX idx_promos_active ON promos(is_active) WHERE is_active = true;
CREATE INDEX idx_promos_date_range ON promos(start_date, end_date);

-- ============================================================
-- TABLE: vibe_checks (Community Authenticity)
-- ============================================================
CREATE TABLE vibe_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    tag_vibe TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vibe checks
CREATE INDEX idx_vibe_checks_venue ON vibe_checks(venue_id);
CREATE INDEX idx_vibe_checks_user ON vibe_checks(user_id);
CREATE INDEX idx_vibe_checks_rating ON vibe_checks(rating DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_checks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================

-- Users can read all profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- RLS POLICIES: venues
-- ============================================================

-- Everyone can view active venues
CREATE POLICY "Active venues are viewable by everyone"
    ON venues FOR SELECT
    USING (is_active = true);

-- Owners can insert their own venues
CREATE POLICY "Owners can insert their own venues"
    ON venues FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Owners can update their own venues
CREATE POLICY "Owners can update their own venues"
    ON venues FOR UPDATE
    USING (owner_id = auth.uid());

-- Owners can delete their own venues
CREATE POLICY "Owners can delete their own venues"
    ON venues FOR DELETE
    USING (owner_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can do everything on venues"
    ON venues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================================
-- RLS POLICIES: promos
-- ============================================================

-- Everyone can view active promos
CREATE POLICY "Active promos are viewable by everyone"
    ON promos FOR SELECT
    USING (
        is_active = true
        AND start_date <= NOW()
        AND end_date >= NOW()
    );

-- Venue owners can manage their promos
CREATE POLICY "Venue owners can manage their promos"
    ON promos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM venues
            WHERE venues.id = promos.venue_id
            AND venues.owner_id = auth.uid()
        )
    );

-- ============================================================
-- RLS POLICIES: vibe_checks
-- ============================================================

-- Everyone can view vibe checks
CREATE POLICY "Vibe checks are viewable by everyone"
    ON vibe_checks FOR SELECT
    USING (true);

-- Authenticated users can create vibe checks
CREATE POLICY "Users can create vibe checks"
    ON vibe_checks FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own vibe checks
CREATE POLICY "Users can update own vibe checks"
    ON vibe_checks FOR UPDATE
    USING (user_id = auth.uid());

-- Users can delete their own vibe checks
CREATE POLICY "Users can delete own vibe checks"
    ON vibe_checks FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to get active promos for a venue
CREATE OR REPLACE FUNCTION get_active_promos(venue_uuid UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price_value NUMERIC,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    day_of_week INT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.description,
        p.price_value,
        p.start_date,
        p.end_date,
        p.day_of_week
    FROM promos p
    WHERE p.venue_id = venue_uuid
    AND p.is_active = true
    AND p.start_date <= NOW()
    AND p.end_date >= NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get average rating for a venue
CREATE OR REPLACE FUNCTION calculate_venue_rating(venue_uuid UUID)
RETURNS FLOAT AS $$
DECLARE
    avg_rating FLOAT;
BEGIN
    SELECT AVG(vc.rating)::FLOAT INTO avg_rating
    FROM vibe_checks vc
    WHERE vc.venue_id = venue_uuid;
    
    RETURN COALESCE(avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to search venues with filters
CREATE OR REPLACE FUNCTION search_venues(
    search_query TEXT DEFAULT NULL,
    filter_category venue_category DEFAULT NULL,
    filter_city TEXT DEFAULT NULL,
    filter_price_min INT DEFAULT NULL,
    filter_price_max INT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    category venue_category,
    description TEXT,
    city TEXT,
    address TEXT,
    price_range INT,
    rating FLOAT,
    features TEXT[],
    images TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.name,
        v.category,
        v.description,
        v.city,
        v.address,
        v.price_range,
        v.rating,
        v.features,
        v.images
    FROM venues v
    WHERE v.is_active = true
    AND (
        search_query IS NULL
        OR v.name ILIKE '%' || search_query || '%'
        OR v.description ILIKE '%' || search_query || '%'
        OR v.city ILIKE '%' || search_query || '%'
    )
    AND (
        filter_category IS NULL
        OR v.category = filter_category
    )
    AND (
        filter_city IS NULL
        OR v.city ILIKE '%' || filter_city || '%'
    )
    AND (
        filter_price_min IS NULL
        OR v.price_range >= filter_price_min
    )
    AND (
        filter_price_max IS NULL
        OR v.price_range <= filter_price_max
    )
    ORDER BY v.rating DESC, v.name ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PHASE 2 MAXIMIZED: ADVANCED SCHEMA EXTENSIONS
-- ============================================================

-- Add new columns to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS price_metadata JSONB DEFAULT '{}';

-- Index for verified venues and slug
CREATE INDEX IF NOT EXISTS idx_venues_verified ON venues(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);

-- ============================================================
-- TABLE: live_vibe_status (Real-time updates)
-- ============================================================
CREATE TABLE IF NOT EXISTS live_vibe_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('quiet', 'crowded', 'full')) DEFAULT 'quiet',
    music_genre TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for live status queries
CREATE INDEX IF NOT EXISTS idx_live_vibe_venue ON live_vibe_status(venue_id);
CREATE INDEX IF NOT EXISTS idx_live_vibe_status ON live_vibe_status(status);

-- ============================================================
-- TABLE: saved_favorites (User engagement)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

-- Index for favorites queries
CREATE INDEX IF NOT EXISTS idx_saved_favorites_user ON saved_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_favorites_venue ON saved_favorites(venue_id);

-- Enable RLS on new tables
ALTER TABLE live_vibe_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_vibe_status
CREATE POLICY "Live status is viewable by everyone"
    ON live_vibe_status FOR SELECT
    USING (true);

-- Only service role can update live status
CREATE POLICY "Service role can update live status"
    ON live_vibe_status FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for saved_favorites
CREATE POLICY "Users can view their own favorites"
    ON saved_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
    ON saved_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
    ON saved_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- SEED DATA (Optional - for development)
-- ============================================================

-- INSERT INTO profiles (id, username, full_name, role)
-- VALUES 
--     (gen_random_uuid(), 'john_doe', 'John Doe', 'owner'),
--     (gen_random_uuid(), 'jane_smith', 'Jane Smith', 'guest');

-- INSERT INTO venues (owner_id, name, category, description, city, address, price_range, rating, features, images)
-- VALUES 
--     (
--         (SELECT id FROM profiles LIMIT 1),
--         'Infinity Club Jakarta',
--         'club',
--         'The ultimate nightlife experience with world-class DJs',
--         'Jakarta',
--         'Jl. Sudirman No. 123',
--         4,
--         4.5,
--         ARRAY['VIP', 'Live DJ', 'Outdoor'],
--         ARRAY['/images/venue1.jpg']
--     );

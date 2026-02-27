-- ============================================================
-- PHASE 2.1: GEOFENCING & LOCATION-BASED DISCOVERY
-- SUPABASE (POSTGRESQL + POSTGIS) VERSION
-- ============================================================

-- 1️⃣ Enable PostGIS (safe)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2️⃣ Ensure venues table exists (basic structure if missing)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.venues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text,
    city text,
    address text,
    price_range int,
    rating float DEFAULT 0,
    features text[],
    images text[],
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    coordinates geography(Point, 4326),
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3️⃣ Ensure coordinates column exists & correct type
-- ============================================================

ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS coordinates geography(Point, 4326);

-- ============================================================
-- 4️⃣ Create spatial index (VERY IMPORTANT for performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_venues_coordinates
ON public.venues
USING GIST (coordinates);

-- ============================================================
-- 5️⃣ Function: Get venues nearby
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_venues_nearby(
    p_lat float,
    p_lng float,
    p_radius_meters float DEFAULT 5000,
    p_limit int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    name text,
    category text,
    city text,
    address text,
    price_range int,
    rating float,
    distance_meters float,
    features text[],
    images text[],
    is_verified boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        COALESCE(v.category, 'club'),
        v.city,
        v.address,
        v.price_range,
        COALESCE(v.rating, 0),
        ST_Distance(
            v.coordinates,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters,
        COALESCE(v.features, ARRAY[]::text[]),
        COALESCE(v.images, ARRAY[]::text[]),
        COALESCE(v.is_verified, false)
    FROM public.venues v
    WHERE v.is_active = true
    AND v.coordinates IS NOT NULL
    AND ST_DWithin(
        v.coordinates,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- 6️⃣ Function: Get nearest venue
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_nearest_venue(
    p_lat float,
    p_lng float
)
RETURNS TABLE (
    id uuid,
    name text,
    city text,
    address text,
    distance_meters float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.city,
        v.address,
        ST_Distance(
            v.coordinates,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters
    FROM public.venues v
    WHERE v.is_active = true
    AND v.coordinates IS NOT NULL
    ORDER BY distance_meters ASC
    LIMIT 1;
END;
$$;

-- ============================================================
-- 7️⃣ Function: Reverse area detection (Jakarta example)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_area_from_coords(
    p_lat float,
    p_lng float
)
RETURNS TABLE (
    area_name text,
    city text,
    region text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p_lat BETWEEN -6.4 AND -6.1 
              AND p_lng BETWEEN 106.6 AND 107.0 THEN
                CASE 
                    WHEN p_lng < 106.8 THEN 'Jakarta Barat'
                    WHEN p_lng < 106.85 THEN 'Jakarta Pusat'
                    WHEN p_lng < 106.9 THEN 'Jakarta Timur'
                    ELSE 'Jakarta Selatan'
                END
            ELSE 'Unknown Area'
        END,
        'Jakarta',
        'DKI Jakarta';
END;
$$;

-- ============================================================
-- 8️⃣ Utility: Calculate distance between two points
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_distance(
    p_lat1 float,
    p_lng1 float,
    p_lat2 float,
    p_lng2 float
)
RETURNS float
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN ST_Distance(
        ST_SetSRID(ST_MakePoint(p_lng1, p_lat1), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_lng2, p_lat2), 4326)::geography
    );
END;
$$;
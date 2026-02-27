-- ============================================================
-- PHASE 2.1: GEOFENCING & LOCATION-BASED DISCOVERY
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Ensure coordinates column uses geography(POINT, 4326)
-- First, drop existing column if it exists with wrong type
ALTER TABLE venues 
ALTER COLUMN coordinates 
TYPE geography(POINT, 4326) 
USING ST_SetSRID(ST_MakePoint(0,0),4326)::geography;

-- Create spatial index for fast geo queries
CREATE INDEX IF NOT EXISTS venues_geo_idx 
ON venues USING GIST (coordinates);

-- Create function to get venues within radius
CREATE OR REPLACE FUNCTION get_venues_nearby(
    user_lat float,
    user_lng float,
    radius_meters float DEFAULT 5000,  -- default 5km
    limit_count int DEFAULT 20
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
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.category::text,
        v.city,
        v.address,
        v.price_range,
        v.rating,
        ST_Distance(
            v.coordinates,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) AS distance_meters,
        v.features,
        v.images,
        v.is_verified
    FROM venues v
    WHERE v.is_active = true
    AND v.coordinates IS NOT NULL
    AND ST_DWithin(
        v.coordinates,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_meters
    )
    ORDER BY distance_meters ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get nearest venue
CREATE OR REPLACE FUNCTION get_nearest_venue(
    user_lat float,
    user_lng float
)
RETURNS TABLE (
    id uuid,
    name text,
    city text,
    address text,
    distance_meters float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.city,
        v.address,
        ST_Distance(
            v.coordinates,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) AS distance_meters
    FROM venues v
    WHERE v.is_active = true
    AND v.coordinates IS NOT NULL
    ORDER BY distance_meters ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create function to convert coordinates to area name (reverse geocoding helper)
CREATE OR REPLACE FUNCTION get_area_from_coords(
    user_lat float,
    user_lng float
)
RETURNS TABLE (
    area_name text,
    city text,
    region text
) AS $$
BEGIN
    -- This is a simplified version - in production, you'd integrate with 
    -- OpenStreetMap Nominatim API or similar service
    -- For now, return placeholder based on coordinates
    
    -- Jakarta area detection (rough bounds)
    RETURN QUERY
    SELECT 
        CASE 
            WHEN user_lat BETWEEN -6.4 AND -6.1 AND user_lng BETWEEN 106.6 AND 107.0 THEN
                CASE 
                    WHEN user_lng < 106.8 THEN 'Jakarta Barat'
                    WHEN user_lng < 106.85 THEN 'Jakarta Pusat'
                    WHEN user_lng < 106.9 THEN 'Jakarta Timur'
                    ELSE 'Jakarta Selatan'
                END
            ELSE 'Unknown Area'
        END::text AS area_name,
        'Jakarta'::text AS city,
        'DKI Jakarta'::text AS region;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POSTGIS GEOSPATIAL EXTENSION
-- Enables location-based queries for venues
-- =====================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- ADD LOCATION COLUMN TO VENUES
-- Using GEOGRAPHY(POINT) for accurate distance calculations
-- =====================================================

-- Add location column as geography point (SRID 4326 = WGS84)
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Create index on location for fast proximity queries
CREATE INDEX IF NOT EXISTS idx_venues_location 
ON venues USING GIST (location);

-- =====================================================
-- TRIGGER FUNCTION TO AUTO-POPULATE LOCATION
-- Updates the location column when lat/lon change
-- =====================================================

CREATE OR REPLACE FUNCTION update_venue_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if lat/lon changed
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    IF OLD.latitude IS DISTINCT FROM NEW.latitude 
       OR OLD.longitude IS DISTINCT FROM NEW.longitude THEN
      NEW.location := ST_SetSRID(
        ST_MakePoint(NEW.longitude, NEW.latitude),
        4326
      )::GEOGRAPHY(POINT, 4326);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_venue_location ON venues;
CREATE TRIGGER trigger_update_venue_location
  BEFORE INSERT OR UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_venue_location();

-- =====================================================
-- SAMPLE VENUES WITH LOCATIONS (For testing)
-- =====================================================

-- Update existing venues with locations
UPDATE venues 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::GEOGRAPHY(POINT, 4326)
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL
  AND location IS NULL;

-- =====================================================
-- NEARBY VENUES QUERY FUNCTION
-- Returns venues within radius sorted by distance
-- =====================================================

CREATE OR REPLACE FUNCTION get_nearby_venues(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_meters FLOAT DEFAULT 5000,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  category VARCHAR(50),
  city VARCHAR(100),
  address TEXT,
  distance_meters FLOAT,
  rating DECIMAL(2,1),
  price_range INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.category,
    v.city,
    v.address,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY
    ) AS distance_meters,
    v.rating,
    v.price_range
  FROM venues v
  WHERE v.is_active = true
    AND v.location IS NOT NULL
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY,
      p_radius_meters
    )
  ORDER BY distance_meters ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VENUE DISTANCE QUERY FUNCTION
-- Get distance from user location to a specific venue
-- =====================================================

CREATE OR REPLACE FUNCTION get_venue_distance(
  p_venue_id UUID,
  p_user_latitude FLOAT,
  p_user_longitude FLOAT
)
RETURNS FLOAT AS $$
DECLARE
  v_distance FLOAT;
  v_location GEOGRAPHY;
BEGIN
  -- Get venue location
  SELECT location INTO v_location
  FROM venues
  WHERE id = p_venue_id;

  IF v_location IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate distance
  v_distance := ST_Distance(
    v_location,
    ST_SetSRID(ST_MakePoint(p_user_longitude, p_user_latitude), 4326)::GEOGRAPHY
  );

  RETURN v_distance;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NEARBY CITIES/AREAS DISCOVERY
-- Find popular venue areas based on location
-- =====================================================

CREATE OR REPLACE FUNCTION discover_areas(
  p_latitude FLOAT,
  p_longitude FLOAT,
  p_radius_meters FLOAT DEFAULT 10000,
  p_min_venues INTEGER DEFAULT 3
)
RETURNS TABLE (
  city VARCHAR(100),
  venue_count INTEGER,
  avg_rating DECIMAL(2,1),
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.city,
    COUNT(*)::INTEGER AS venue_count,
    ROUND(AVG(v.rating), 1) AS avg_rating,
    ROUND(
      ST_Distance(
        ST_SetSRID(ST_MakePoint(v.longitude, v.latitude), 4326)::GEOGRAPHY,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY
      ) / 1000,
      1
    ) AS distance_km
  FROM venues v
  WHERE v.is_active = true
    AND v.location IS NOT NULL
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::GEOGRAPHY,
      p_radius_meters
    )
  GROUP BY v.city, v.longitude, v.latitude
  HAVING COUNT(*) >= p_min_venues
  ORDER BY venue_count DESC, distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEW: VENUES WITH DISTANCE (for common queries)
-- =====================================================

DROP MATERIALIZED VIEW IF EXISTS venues_with_distance CASCADE;

CREATE MATERIALIZED VIEW venues_with_distance AS
SELECT 
  v.id,
  v.name,
  v.category,
  v.city,
  v.address,
  v.latitude,
  v.longitude,
  v.rating,
  v.price_range,
  v.images,
  v.is_active,
  ST_AsText(v.location) as location_wkt
FROM venues v
WHERE v.is_active = true;

CREATE UNIQUE INDEX idx_venues_with_distance_id ON venues_with_distance(id);

-- Refresh view periodically
-- SELECT refresh_all_materialized_views();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

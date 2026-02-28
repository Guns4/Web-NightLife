-- =====================================================
-- POSTGIS MIGRATION
-- Enables geospatial capabilities for venue search
-- =====================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create location column using geography type for accurate distance calculations
ALTER TABLE "Venue" 
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Update existing rows with location data from latitude/longitude
UPDATE "Venue" 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::GEOGRAPHY
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create GIST index for sub-millisecond spatial queries
-- This index enables fast proximity searches using ST_DWithin
CREATE INDEX IF NOT EXISTS "Venue_location_gist_idx" 
ON "Venue" 
USING GIST (location);

-- Create composite index for filtered spatial queries
CREATE INDEX IF NOT EXISTS "Venue_location_active_idx" 
ON "Venue" 
USING GIST (location) 
WHERE "isActive" = true;

-- Create indexes for tag filtering (for Array columns)
CREATE INDEX IF NOT EXISTS "Venue_music_genres_idx" 
ON "Venue" USING GIN ("musicGenres");

CREATE INDEX IF NOT EXISTS "Venue_vibes_idx" 
ON "Venue" USING GIN (vibes);

CREATE INDEX IF NOT EXISTS "Venue_facilities_idx" 
ON "Venue" USING GIN (facilities);

-- Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS "Venue_category_idx" 
ON "Venue" (category);

-- Add index on trust score for ranking
CREATE INDEX IF NOT EXISTS "Venue_trust_score_idx" 
ON "Venue" ("trustScore" DESC);

-- Add index on isBoosted for promoted venues
CREATE INDEX IF NOT EXISTS "Venue_boosted_idx" 
ON "Venue" ("isBoosted") 
WHERE "isBoosted" = true;

COMMENT ON INDEX "Venue_location_gist_idx" IS 'GIST index for geospatial proximity searches - enables sub-millisecond ST_DWithin queries';

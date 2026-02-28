-- =====================================================
-- AI RECOMMENDATION ENGINE
-- AfterHoursID - User Preference & ML Data
-- =====================================================

-- User-Venue Interactions (for collaborative filtering)
CREATE TABLE IF NOT EXISTS venue_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL CHECK (
        interaction_type IN ('view', 'like', 'book', 'review', 'share', 'skip')
    ),
    interaction_score DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    session_id VARCHAR(255),
    device_type VARCHAR(50),
    duration_seconds INTEGER, -- Time spent viewing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, venue_id, interaction_type)
);

-- User Category Preferences
CREATE TABLE IF NOT EXISTS user_category_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    preference_score DECIMAL(5,4) NOT NULL DEFAULT 0.0, -- 0.0 to 1.0
    interaction_count INTEGER NOT NULL DEFAULT 0,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, category)
);

-- User Price Range Preferences
CREATE TABLE IF NOT EXISTS user_price_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price_range VARCHAR(10) NOT NULL CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    preference_score DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, price_range)
);

-- User Location Preferences
CREATE TABLE IF NOT EXISTS user_location_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    preference_score DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, city, district)
);

-- User-User Similarity (collaborative filtering)
CREATE TABLE IF NOT EXISTS user_similarity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,4) NOT NULL, -- Cosine similarity
    common_interactions INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id_1, user_id_2)
);

-- Venue-Venue Similarity (content-based)
CREATE TABLE IF NOT EXISTS venue_similarity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id_1 UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    venue_id_2 UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    similarity_type VARCHAR(50) NOT NULL CHECK (
        similarity_type IN ('category', 'location', 'price', 'vibe', 'combined')
    ),
    similarity_score DECIMAL(5,4) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(venue_id_1, venue_id_2, similarity_type)
);

-- Venue Trends (for viral detection)
CREATE TABLE IF NOT EXISTS venue_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL CHECK (
        metric_type IN ('checkins', 'views', 'bookings', 'reviews')
    ),
    current_count INTEGER NOT NULL DEFAULT 0,
    previous_7day_avg DECIMAL(10,2) NOT NULL DEFAULT 0,
    spike_percentage DECIMAL(10,2) NOT NULL DEFAULT 0,
    trend_status VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (
        trend_status IN ('normal', 'rising', 'hot', 'viral')
    ),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(venue_id, metric_type)
);

-- User Active Hours (predictive scheduling)
CREATE TABLE IF NOT EXISTS user_active_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
    activity_score DECIMAL(5,4) NOT NULL DEFAULT 0.0,
    interaction_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, day_of_week, hour_of_day)
);

-- User Blocked Recommendations (feedback loop)
CREATE TABLE IF NOT EXISTS user_hidden_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    reason VARCHAR(50) CHECK (reason IN ('not_interested', 'already_visited', 'not_relevant', 'reported')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, venue_id)
);

-- AI Recommendation Logs (for algorithm training)
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    recommendation_type VARCHAR(50) NOT NULL CHECK (
        recommendation_type IN ('for_you', 'similar', 'trending', 'nearby', 'personalized')
    ),
    venues_shown JSONB NOT NULL, -- Array of venue IDs
    venues_clicked JSONB, -- Array of venue IDs user clicked
    venues_booked JSONB, -- Array of venue IDs user booked
    position_clicked INTEGER, -- Position of clicked venue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion Attribution
CREATE TABLE IF NOT EXISTS recommendation_attribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    attribution_type VARCHAR(50) NOT NULL CHECK (
        attribution_type IN ('ai_recommendation', 'search', 'direct', 'social', 'organic')
    ),
    conversion_type VARCHAR(50) NOT NULL CHECK (
        conversion_type IN ('view', 'like', 'book', 'review')
    ),
    attributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_interactions_user ON venue_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_interactions_venue ON venue_interactions(venue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_category_prefs ON user_category_preferences(user_id, preference_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_similarity ON user_similarity(user_id_1, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_venue_similarity ON venue_similarity(venue_id_1, similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_venue_trends_spike ON venue_trends(spike_percentage DESC) WHERE spike_percentage > 100;
CREATE INDEX IF NOT EXISTS idx_user_active_hours ON user_active_hours(user_id, activity_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user ON recommendation_logs(user_id, created_at DESC);

-- Interaction weights for scoring
-- view: 1.0
-- like: 2.0
-- book: 5.0
-- review: 3.0
-- share: 4.0
-- skip: -1.0

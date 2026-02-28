-- =====================================================
-- SEARCH ANALYTICS SCHEMA
-- AfterHoursID - Discovery Analytics
-- =====================================================

-- Search queries log
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id),
    results_count INTEGER DEFAULT 0,
    filters JSONB,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast trending searches
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);

-- Trending searches view
CREATE OR REPLACE VIEW trending_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    SUM(results_count) as total_results,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as first_searched,
    MAX(created_at) as last_searched
FROM search_analytics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 50;

-- Popular categories view
CREATE OR REPLACE VIEW popular_search_categories AS
SELECT 
    category,
    COUNT(*) as search_count,
    AVG(results_count) as avg_results
FROM search_analytics,
    LATERAL jsonb_array_elements_text(
        COALESCE(filters->>'categories', '[]')::jsonb
    ) as category
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY category
ORDER BY search_count DESC;

-- No-result searches (opportunities)
CREATE OR REPLACE VIEW no_result_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    MAX(created_at) as last_searched
FROM search_analytics
WHERE results_count = 0
    AND created_at > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 20;

# Supabase Setup Instructions

## Environment Variables

The `.env.local` file has been created with your Supabase credentials.

## Database Schema Setup

### Option 1: Run via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `mttetyhvfkjhlilgvvuj`
3. Navigate to **SQL Editor** in the left sidebar
4. Copy and paste the contents of [`src/lib/database/schema.sql`](src/lib/database/schema.sql)
5. Click **Run** to execute

### Option 2: Run via Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref mttetyhvfkjhlilgvvuj

# Run migrations
supabase db push
```

## What the Schema Creates

- **Tables**: profiles, venues, promos, vibe_checks, live_vibe_status, saved_favorites
- **Enums**: user_role (guest/owner/admin), venue_category (club/karaoke/ktv/spa)
- **Indexes**: For fast filtering on city, category, price_range, rating, etc.
- **RLS Policies**: Row-level security for all tables
- **Triggers**: Auto-create profile on user signup

## After Setup

1. Restart your dev server: `npm run dev`
2. The app will now connect to your Supabase database
3. Test the database by visiting the site

## Testing Data

You can add test data via the SQL Editor:

```sql
-- Insert a test venue
INSERT INTO venues (name, category, city, description, price_range, rating, is_verified)
VALUES (
  'Infinity Club Jakarta',
  'club',
  'Jakarta',
  'The ultimate nightlife experience with world-class DJs',
  4,
  4.5,
  true
);
```

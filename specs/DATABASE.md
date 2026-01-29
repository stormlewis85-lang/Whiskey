# WhiskeyPedia Database Schema

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│   users     │       │  whiskeys   │       │  distilleries   │
├─────────────┤       ├─────────────┤       ├─────────────────┤
│ id (PK)     │──┐    │ id (PK)     │    ┌──│ id (PK)         │
│ email       │  │    │ user_id(FK) │◄───┘  │ name            │
│ password    │  │    │ distillery_ │───────│ location        │
│ username    │  │    │   id (FK)   │       │ country         │
│ created_at  │  │    │ name        │       │ region          │
└─────────────┘  │    │ type        │       │ type            │
                 │    │ age         │       │ year_founded    │
                 │    │ abv         │       │ parent_company  │
                 │    │ price       │       │ website         │
                 │    │ status      │       │ description     │
                 │    │ is_wishlist │       └─────────────────┘
                 │    │ notes       │
                 │    │ created_at  │       ┌─────────────────┐
                 │    └─────────────┘       │    reviews      │
                 │           │              ├─────────────────┤
                 │           │              │ id (PK)         │
                 │           └──────────────│ whiskey_id (FK) │
                 │                          │ user_id (FK)    │◄──┐
                 └──────────────────────────│                 │   │
                                            │ taste_score     │   │
                                            │ finish_score    │   │
                                            │ mouthfeel_score │   │
                                            │ nose_score      │   │
                                            │ value_score     │   │
                                            │ overall_score   │   │
                                            │ weighted_score  │   │
                                            │ star_rating     │   │
                                            │ point_rating    │   │
                                            │ tasting_notes   │   │
                                            │ flavor_tags     │   │
                                            │ created_at      │   │
                                            └─────────────────┘   │
                                                                  │
┌─────────────────┐       ┌─────────────────┐                     │
│  tasting_flights│       │ flight_whiskeys │                     │
├─────────────────┤       ├─────────────────┤                     │
│ id (PK)         │───────│ flight_id (FK)  │                     │
│ user_id (FK)    │◄──────│ whiskey_id (FK) │                     │
│ name            │       │ position        │                     │
│ description     │       │ notes           │                     │
│ created_at      │       └─────────────────┘                     │
└─────────────────┘                                               │
                                                                  │
┌─────────────────┐       ┌─────────────────┐                     │
│ blind_tastings  │       │ blind_samples   │                     │
├─────────────────┤       ├─────────────────┤                     │
│ id (PK)         │───────│ tasting_id (FK) │                     │
│ user_id (FK)    │◄──────│ whiskey_id (FK) │                     │
│ name            │       │ label (A,B,C)   │                     │
│ is_revealed     │       │ blind_rating    │                     │
│ created_at      │       │ notes           │                     │
└─────────────────┘       └─────────────────┘                     │
                                                                  │
┌─────────────────┐                                               │
│  user_profiles  │                                               │
├─────────────────┤                                               │
│ user_id (FK,PK) │◄──────────────────────────────────────────────┘
│ bio             │
│ slug            │
│ is_public       │
│ updated_at      │
└─────────────────┘
```

## Table Definitions

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### distilleries
```sql
CREATE TABLE distilleries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  country VARCHAR(100),
  region VARCHAR(100),
  type VARCHAR(50),
  year_founded INTEGER,
  parent_company VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_distilleries_name ON distilleries(name);
CREATE INDEX idx_distilleries_country ON distilleries(country);
```

### whiskeys
```sql
CREATE TABLE whiskeys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  distillery_id INTEGER REFERENCES distilleries(id),
  distillery_name VARCHAR(255),  -- Legacy field, prefer distillery_id
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),              -- Bourbon, Rye, Scotch, Irish, Japanese, etc.
  age INTEGER,                   -- Age statement in years (NULL if NAS)
  abv DECIMAL(4,1),             -- Alcohol by volume
  proof DECIMAL(4,1),           -- Proof (calculated: abv * 2)
  price DECIMAL(10,2),          -- Purchase price
  purchase_date DATE,
  purchase_location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'sealed',  -- sealed, open, finished
  opened_date DATE,
  is_wishlist BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  notes TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whiskeys_user_id ON whiskeys(user_id);
CREATE INDEX idx_whiskeys_distillery_id ON whiskeys(distillery_id);
CREATE INDEX idx_whiskeys_type ON whiskeys(type);
CREATE INDEX idx_whiskeys_status ON whiskeys(status);
```

### reviews
```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  whiskey_id INTEGER NOT NULL REFERENCES whiskeys(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 6 Component Scores (1-10 scale)
  taste_score INTEGER CHECK (taste_score >= 1 AND taste_score <= 10),
  finish_score INTEGER CHECK (finish_score >= 1 AND finish_score <= 10),
  mouthfeel_score INTEGER CHECK (mouthfeel_score >= 1 AND mouthfeel_score <= 10),
  nose_score INTEGER CHECK (nose_score >= 1 AND nose_score <= 10),
  value_score INTEGER CHECK (value_score >= 1 AND value_score <= 10),
  overall_score INTEGER CHECK (overall_score >= 1 AND overall_score <= 10),
  
  -- Calculated Scores
  weighted_score DECIMAL(4,2),   -- Raw weighted calculation
  star_rating DECIMAL(2,1),      -- 1-5 scale with half stars
  point_rating INTEGER,          -- 0-100 scale
  
  -- Content
  tasting_notes TEXT,
  ai_generated_notes TEXT,
  flavor_tags TEXT[],            -- Array of flavor descriptors
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(whiskey_id, user_id)    -- One review per user per whiskey
);

CREATE INDEX idx_reviews_whiskey_id ON reviews(whiskey_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
```

### tasting_flights
```sql
CREATE TABLE tasting_flights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flight_whiskeys (
  id SERIAL PRIMARY KEY,
  flight_id INTEGER NOT NULL REFERENCES tasting_flights(id) ON DELETE CASCADE,
  whiskey_id INTEGER NOT NULL REFERENCES whiskeys(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(flight_id, whiskey_id)
);
```

### blind_tastings
```sql
CREATE TABLE blind_tastings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blind_samples (
  id SERIAL PRIMARY KEY,
  tasting_id INTEGER NOT NULL REFERENCES blind_tastings(id) ON DELETE CASCADE,
  whiskey_id INTEGER NOT NULL REFERENCES whiskeys(id) ON DELETE CASCADE,
  label CHAR(1) NOT NULL,        -- A, B, C, etc.
  blind_rating INTEGER,
  notes TEXT,
  UNIQUE(tasting_id, whiskey_id),
  UNIQUE(tasting_id, label)
);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  slug VARCHAR(100) UNIQUE,
  is_public BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_slug ON user_profiles(slug);
```

## Common Queries

### Get user's collection with distillery info
```sql
SELECT w.*, d.name as distillery_name, d.location, d.country,
       r.star_rating, r.point_rating
FROM whiskeys w
LEFT JOIN distilleries d ON w.distillery_id = d.id
LEFT JOIN reviews r ON r.whiskey_id = w.id AND r.user_id = w.user_id
WHERE w.user_id = $1 AND w.is_wishlist = FALSE
ORDER BY w.created_at DESC;
```

### Get whiskey with full review
```sql
SELECT w.*, d.*, r.*
FROM whiskeys w
LEFT JOIN distilleries d ON w.distillery_id = d.id
LEFT JOIN reviews r ON r.whiskey_id = w.id
WHERE w.id = $1 AND w.user_id = $2;
```

### Collection statistics
```sql
SELECT 
  COUNT(*) as total_bottles,
  COUNT(DISTINCT distillery_id) as unique_distilleries,
  COUNT(*) FILTER (WHERE status = 'sealed') as sealed,
  COUNT(*) FILTER (WHERE status = 'open') as open,
  COUNT(*) FILTER (WHERE status = 'finished') as finished,
  AVG(price) as avg_price,
  SUM(price) as total_value
FROM whiskeys
WHERE user_id = $1 AND is_wishlist = FALSE;
```

## Migration Notes

When making schema changes:
1. Create a new migration file: `migrations/YYYYMMDD_description.sql`
2. Include both UP and DOWN migrations
3. Test on a copy of the database first
4. Run migrations in order
5. Update this document

## Seed Data

The `distilleries` table should be pre-seeded with ~75 major distilleries. See `database/seeds/distilleries.sql` for the full list including:
- Buffalo Trace, Four Roses, Wild Turkey, Maker's Mark (Kentucky)
- MGP (Indiana)
- Jack Daniel's, George Dickel (Tennessee)
- Major Scotch distilleries by region
- Japanese distilleries (Yamazaki, Hakushu, Nikka)

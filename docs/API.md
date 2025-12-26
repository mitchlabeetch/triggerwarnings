# API Documentation

Backend API reference for Trigger Warnings extension integration with Supabase.

---

## 📋 Overview

The Trigger Warnings extension uses **Supabase** (PostgreSQL + REST API) as its backend. This document covers:
- Database schema
- API endpoints
- Authentication
- Rate limiting
- Error handling

---

## 🔐 Authentication

### Anonymous Authentication

The extension uses **anonymous authentication** by default:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Sign in anonymously
const { data, error } = await supabase.auth.signInAnonymously();
```

**Benefits:**
- No user registration required
- Privacy-preserving (no email/password)
- Session persists across browser restarts

**Limitations:**
- Can't track user contributions across devices
- Can't implement user reputation system (yet)

### Future: User Accounts

Planned for v3.0:
- Optional email/password authentication
- OAuth (Google, GitHub, etc.)
- User profiles with contribution history
- Reputation system

---

## 🗄️ Database Schema

### Table: `warnings`

Stores all trigger warnings submitted by the community.

```sql
CREATE TABLE warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id TEXT NOT NULL,           -- "tt1234567-s01e01"
  type TEXT NOT NULL,                 -- "violence", "gore", etc.
  timestamp INTEGER NOT NULL,         -- Seconds into video
  duration INTEGER NOT NULL,          -- Length of scene (seconds)
  severity TEXT NOT NULL,             -- "mild", "moderate", "severe"
  description TEXT,                   -- Optional context
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_type CHECK (type IN (
    'violence', 'gore', 'sexual_assault', 'self_harm',
    'medical', 'spiders', 'emetophobia', 'loud_noises',
    'flashing_lights', 'animal_harm', 'alcohol', 'drugs', 'smoking'
  )),
  CONSTRAINT check_severity CHECK (severity IN ('mild', 'moderate', 'severe')),
  CONSTRAINT check_timestamp CHECK (timestamp >= 0),
  CONSTRAINT check_duration CHECK (duration > 0)
);

-- Indexes for performance
CREATE INDEX idx_warnings_content_id ON warnings(content_id);
CREATE INDEX idx_warnings_type ON warnings(type);
CREATE INDEX idx_warnings_timestamp ON warnings(timestamp);
CREATE INDEX idx_warnings_created_at ON warnings(created_at DESC);
```

### Table: `votes`

Tracks user votes on warnings (prevents duplicate voting).

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  warning_id UUID NOT NULL REFERENCES warnings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(warning_id, user_id) -- One vote per user per warning
);

CREATE INDEX idx_votes_warning_id ON votes(warning_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
```

### Table: `content_metadata`

Stores metadata about movies/shows (titles, IMDb IDs, etc.).

```sql
CREATE TABLE content_metadata (
  id TEXT PRIMARY KEY,                -- "tt1234567-s01e01"
  imdb_id TEXT,                       -- "tt1234567"
  title TEXT NOT NULL,
  year INTEGER,
  season INTEGER,
  episode INTEGER,
  platform TEXT[],                    -- ["netflix", "hulu"]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_imdb_id ON content_metadata(imdb_id);
CREATE INDEX idx_content_title ON content_metadata(title);
```

---

## 🔌 API Endpoints

### Fetch Warnings

**GET** `/warnings?content_id=eq.{contentId}`

Retrieve all warnings for a specific piece of content.

**Request:**
```typescript
const { data, error } = await supabase
  .from('warnings')
  .select('*')
  .eq('content_id', 'tt4574334-s01e01')
  .gte('votes_up - votes_down', -5) // Filter out heavily downvoted
  .order('timestamp', { ascending: true });
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "content_id": "tt4574334-s01e01",
    "type": "violence",
    "timestamp": 323,
    "duration": 12,
    "severity": "moderate",
    "description": "Fight scene in the woods",
    "votes_up": 15,
    "votes_down": 2,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Submit Warning

**POST** `/warnings`

Add a new trigger warning.

**Request:**
```typescript
const { data, error } = await supabase
  .from('warnings')
  .insert({
    content_id: 'tt4574334-s01e01',
    type: 'spiders',
    timestamp: 456,
    duration: 8,
    severity: 'mild',
    description: 'Spider in basement scene',
  })
  .select()
  .single();
```

**Response:**
```json
{
  "id": "987f6543-e21b-12d3-a456-426614174111",
  "content_id": "tt4574334-s01e01",
  "type": "spiders",
  "timestamp": 456,
  "duration": 8,
  "severity": "mild",
  "description": "Spider in basement scene",
  "votes_up": 0,
  "votes_down": 0,
  "submitted_by": "anonymous-user-uuid",
  "created_at": "2024-01-15T11:00:00Z"
}
```

**Validation:**
- All required fields must be present
- `type` must be a valid trigger category
- `timestamp >= 0`
- `duration > 0`
- `severity` must be 'mild', 'moderate', or 'severe'

### Vote on Warning

**POST** `/rpc/vote_on_warning`

Upvote or downvote a warning (using stored procedure to prevent duplicate votes).

**Request:**
```typescript
const { data, error } = await supabase.rpc('vote_on_warning', {
  p_warning_id: '123e4567-e89b-12d3-a456-426614174000',
  p_vote_type: 'up', // or 'down'
});
```

**Stored Procedure:**
```sql
CREATE OR REPLACE FUNCTION vote_on_warning(
  p_warning_id UUID,
  p_vote_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_existing_vote TEXT;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Check for existing vote
  SELECT vote_type INTO v_existing_vote
  FROM votes
  WHERE warning_id = p_warning_id AND user_id = v_user_id;

  IF v_existing_vote IS NOT NULL THEN
    -- User already voted
    IF v_existing_vote = p_vote_type THEN
      RETURN json_build_object('error', 'Already voted');
    ELSE
      -- Change vote
      UPDATE votes
      SET vote_type = p_vote_type, created_at = NOW()
      WHERE warning_id = p_warning_id AND user_id = v_user_id;
      
      -- Update warning counts
      IF p_vote_type = 'up' THEN
        UPDATE warnings
        SET votes_up = votes_up + 1, votes_down = votes_down - 1
        WHERE id = p_warning_id;
      ELSE
        UPDATE warnings
        SET votes_up = votes_up - 1, votes_down = votes_down + 1
        WHERE id = p_warning_id;
      END IF;
      
      RETURN json_build_object('success', true, 'action', 'changed');
    END IF;
  ELSE
    -- New vote
    INSERT INTO votes (warning_id, user_id, vote_type)
    VALUES (p_warning_id, v_user_id, p_vote_type);
    
    -- Update warning counts
    IF p_vote_type = 'up' THEN
      UPDATE warnings SET votes_up = votes_up + 1 WHERE id = p_warning_id;
    ELSE
      UPDATE warnings SET votes_down = votes_down + 1 WHERE id = p_warning_id;
    END IF;
    
    RETURN json_build_object('success', true, 'action', 'added');
  END IF;
END;
$$;
```

**Response:**
```json
{
  "success": true,
  "action": "added"  // or "changed"
}
```

### Fetch Content Metadata

**GET** `/content_metadata?id=eq.{contentId}`

Get metadata for a specific content ID.

**Request:**
```typescript
const { data, error } = await supabase
  .from('content_metadata')
  .select('*')
  .eq('id', 'tt4574334-s01e01')
  .single();
```

**Response:**
```json
{
  "id": "tt4574334-s01e01",
  "imdb_id": "tt4574334",
  "title": "Stranger Things",
  "year": 2016,
  "season": 1,
  "episode": 1,
  "platform": ["netflix"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## 🔒 Row-Level Security (RLS)

Supabase uses PostgreSQL's Row-Level Security to control access.

### Warnings Table Policies

```sql
-- Anyone can read warnings
CREATE POLICY "Public read access" ON warnings
  FOR SELECT
  USING (true);

-- Authenticated users can insert warnings
CREATE POLICY "Authenticated insert" ON warnings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update their own warnings (first 10 minutes only)
CREATE POLICY "Users can update own warnings" ON warnings
  FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid() AND
    created_at > NOW() - INTERVAL '10 minutes'
  );

-- Moderators can delete any warning
CREATE POLICY "Moderators can delete" ON warnings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'moderator'
    )
  );
```

### Votes Table Policies

```sql
-- Users can read their own votes
CREATE POLICY "Users read own votes" ON votes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert votes
CREATE POLICY "Users can vote" ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## ⚠️ Error Handling

### Common Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `PGRST116` | Not found | Content ID doesn't exist | Submit warning for this content |
| `PGRST202` | Permission denied | Not authenticated | Sign in anonymously |
| `23505` | Duplicate key | Unique constraint violation | User already voted on this warning |
| `23514` | Check constraint violation | Invalid enum value | Use valid trigger type/severity |
| `08006` | Connection failure | Network issue | Retry with exponential backoff |

### Error Handling Example

```typescript
async function fetchWarnings(contentId: string): Promise<Warning[]> {
  try {
    const { data, error } = await supabase
      .from('warnings')
      .select('*')
      .eq('content_id', contentId);

    if (error) {
      console.error('[TW API] Error fetching warnings:', error);
      
      // Handle specific errors
      if (error.code === 'PGRST116') {
        // No warnings found - this is okay
        return [];
      }
      
      if (error.code === '08006') {
        // Network error - retry
        return await retryWithBackoff(() => fetchWarnings(contentId));
      }
      
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[TW API] Unexpected error:', error);
    return []; // Graceful degradation
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 🚦 Rate Limiting

Supabase enforces rate limits on the free tier:

| Resource | Limit | Reset |
|----------|-------|-------|
| API Requests | 500 requests/sec | N/A |
| Database Connections | 60 concurrent | N/A |
| Storage | 500 MB | N/A |

**Best practices:**
- Cache warnings locally (`chrome.storage.local`)
- Batch requests when possible
- Implement exponential backoff for retries

### Caching Strategy

```typescript
class WarningCache {
  private cache = new Map<string, { warnings: Warning[]; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async get(contentId: string): Promise<Warning[] | null> {
    const cached = this.cache.get(contentId);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.warnings;
    }
    
    return null;
  }

  set(contentId: string, warnings: Warning[]): void {
    this.cache.set(contentId, {
      warnings,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}
```

---

## 📊 Analytics & Monitoring

### Supabase Dashboard

Monitor API usage:
1. Go to Supabase dashboard
2. Project → API → Logs
3. View:
   - Request count
   - Error rate
   - Average response time

### Application Logs

```typescript
import { logger } from '@shared/utils/logger';

logger.info('[TW API] Fetching warnings', { contentId });
logger.warn('[TW API] Slow query', { duration: 2500 });
logger.error('[TW API] Failed to fetch', { error });
```

---

## 🔮 Future API Features

### Planned Endpoints

- **`POST /reports`**: Report inappropriate warnings
- **`GET /statistics`**: Get warning stats (most common triggers, etc.)
- **`POST /batch-warnings`**: Submit multiple warnings at once
- **`GET /user-profile`**: Get user's contribution history (requires auth)

### GraphQL API

Planned for v3.0 to reduce over-fetching:

```graphql
query GetWarnings($contentId: String!) {
  warnings(where: { content_id: { _eq: $contentId } }) {
    id
    type
    timestamp
    duration
    severity
    votes {
      up: votes_up
      down: votes_down
    }
  }
}
```

---

## 🛠️ Self-Hosting

Want to run your own backend?

1. **Fork the database schema** (see `/supabase/migrations/`)
2. **Create Supabase project**: https://supabase.com
3. **Run migrations**: `supabase db push`
4. **Update `.env`**:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. **Rebuild extension**: `npm run build`

---

<div align="center">

**Questions?** [Open a discussion](https://github.com/mitchlabeetch/Trigger_Warnings/discussions) 💬

[Back to README](../README.md)

</div>

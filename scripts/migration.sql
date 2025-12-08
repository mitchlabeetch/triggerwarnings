
-- ============================================
-- TRIGGER WARNINGS DATABASE MIGRATION
-- Created: 2025-12-08T08:16:54.483Z
-- ============================================

-- Helper function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: media_content
-- ============================================

    CREATE TABLE IF NOT EXISTS media_content (
      internal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      imdb_id VARCHAR(20) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year >= 1888 AND year <= 2100),
      type VARCHAR(10) NOT NULL CHECK (type IN ('movie', 'episode', 'series', 'short')),
      season INTEGER,
      episode INTEGER,
      series_imdb_id VARCHAR(20),
      netflix_id VARCHAR(50),
      amazon_id VARCHAR(50),
      disney_id VARCHAR(50),
      hulu_id VARCHAR(50),
      max_id VARCHAR(50),
      peacock_id VARCHAR(50),
      youtube_id VARCHAR(100),
      is_fully_reviewed BOOLEAN DEFAULT false,
      review_status VARCHAR(20) DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'partial', 'community_reviewed', 'verified')),
      review_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT valid_episode_info CHECK (
        (type != 'episode') OR 
        (type = 'episode' AND season IS NOT NULL AND episode IS NOT NULL)
      )
    );
  

-- Indexes for fast platform lookups
CREATE INDEX IF NOT EXISTS idx_media_netflix ON media_content(netflix_id) WHERE netflix_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_amazon ON media_content(amazon_id) WHERE amazon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_disney ON media_content(disney_id) WHERE disney_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_hulu ON media_content(hulu_id) WHERE hulu_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_max ON media_content(max_id) WHERE max_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_peacock ON media_content(peacock_id) WHERE peacock_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_youtube ON media_content(youtube_id) WHERE youtube_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_imdb ON media_content(imdb_id);
CREATE INDEX IF NOT EXISTS idx_media_name ON media_content(name);

-- Auto-update trigger
DROP TRIGGER IF EXISTS trigger_media_content_updated_at ON media_content;
CREATE TRIGGER trigger_media_content_updated_at
  BEFORE UPDATE ON media_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: overall_triggers
-- ============================================

    CREATE TABLE IF NOT EXISTS overall_triggers (
      media_id UUID PRIMARY KEY REFERENCES media_content(internal_id) ON DELETE CASCADE,
  violence_severity INTEGER DEFAULT 0 CHECK (violence_severity >= 0 AND violence_severity <= 3),
  blood_severity INTEGER DEFAULT 0 CHECK (blood_severity >= 0 AND blood_severity <= 3),
  gore_severity INTEGER DEFAULT 0 CHECK (gore_severity >= 0 AND gore_severity <= 3),
  sexual_assault_severity INTEGER DEFAULT 0 CHECK (sexual_assault_severity >= 0 AND sexual_assault_severity <= 3),
  sex_severity INTEGER DEFAULT 0 CHECK (sex_severity >= 0 AND sex_severity <= 3),
  self_harm_severity INTEGER DEFAULT 0 CHECK (self_harm_severity >= 0 AND self_harm_severity <= 3),
  suicide_severity INTEGER DEFAULT 0 CHECK (suicide_severity >= 0 AND suicide_severity <= 3),
  eating_disorders_severity INTEGER DEFAULT 0 CHECK (eating_disorders_severity >= 0 AND eating_disorders_severity <= 3),
  drugs_severity INTEGER DEFAULT 0 CHECK (drugs_severity >= 0 AND drugs_severity <= 3),
  swear_words_severity INTEGER DEFAULT 0 CHECK (swear_words_severity >= 0 AND swear_words_severity <= 3),
  spiders_snakes_severity INTEGER DEFAULT 0 CHECK (spiders_snakes_severity >= 0 AND spiders_snakes_severity <= 3),
  animal_cruelty_severity INTEGER DEFAULT 0 CHECK (animal_cruelty_severity >= 0 AND animal_cruelty_severity <= 3),
  child_abuse_severity INTEGER DEFAULT 0 CHECK (child_abuse_severity >= 0 AND child_abuse_severity <= 3),
  children_screaming_severity INTEGER DEFAULT 0 CHECK (children_screaming_severity >= 0 AND children_screaming_severity <= 3),
  domestic_violence_severity INTEGER DEFAULT 0 CHECK (domestic_violence_severity >= 0 AND domestic_violence_severity <= 3),
  racial_violence_severity INTEGER DEFAULT 0 CHECK (racial_violence_severity >= 0 AND racial_violence_severity <= 3),
  lgbtq_phobia_severity INTEGER DEFAULT 0 CHECK (lgbtq_phobia_severity >= 0 AND lgbtq_phobia_severity <= 3),
  religious_trauma_severity INTEGER DEFAULT 0 CHECK (religious_trauma_severity >= 0 AND religious_trauma_severity <= 3),
  dead_body_body_horror_severity INTEGER DEFAULT 0 CHECK (dead_body_body_horror_severity >= 0 AND dead_body_body_horror_severity <= 3),
  torture_severity INTEGER DEFAULT 0 CHECK (torture_severity >= 0 AND torture_severity <= 3),
  murder_severity INTEGER DEFAULT 0 CHECK (murder_severity >= 0 AND murder_severity <= 3),
  detonations_bombs_severity INTEGER DEFAULT 0 CHECK (detonations_bombs_severity >= 0 AND detonations_bombs_severity <= 3),
  medical_procedures_severity INTEGER DEFAULT 0 CHECK (medical_procedures_severity >= 0 AND medical_procedures_severity <= 3),
  vomit_severity INTEGER DEFAULT 0 CHECK (vomit_severity >= 0 AND vomit_severity <= 3),
  flashing_lights_severity INTEGER DEFAULT 0 CHECK (flashing_lights_severity >= 0 AND flashing_lights_severity <= 3),
  jumpscares_severity INTEGER DEFAULT 0 CHECK (jumpscares_severity >= 0 AND jumpscares_severity <= 3),
  natural_disasters_severity INTEGER DEFAULT 0 CHECK (natural_disasters_severity >= 0 AND natural_disasters_severity <= 3),
  cannibalism_severity INTEGER DEFAULT 0 CHECK (cannibalism_severity >= 0 AND cannibalism_severity <= 3),
  gunshots_severity INTEGER DEFAULT 0 CHECK (gunshots_severity >= 0 AND gunshots_severity <= 3),
  explosions_severity INTEGER DEFAULT 0 CHECK (explosions_severity >= 0 AND explosions_severity <= 3),
  screams_severity INTEGER DEFAULT 0 CHECK (screams_severity >= 0 AND screams_severity <= 3),
  slurs_severity INTEGER DEFAULT 0 CHECK (slurs_severity >= 0 AND slurs_severity <= 3),
  hate_speech_severity INTEGER DEFAULT 0 CHECK (hate_speech_severity >= 0 AND hate_speech_severity <= 3),
  threats_severity INTEGER DEFAULT 0 CHECK (threats_severity >= 0 AND threats_severity <= 3),
  photosensitivity_severity INTEGER DEFAULT 0 CHECK (photosensitivity_severity >= 0 AND photosensitivity_severity <= 3),
  loud_noises_severity INTEGER DEFAULT 0 CHECK (loud_noises_severity >= 0 AND loud_noises_severity <= 3),
  insects_spiders_severity INTEGER DEFAULT 0 CHECK (insects_spiders_severity >= 0 AND insects_spiders_severity <= 3),
  snakes_reptiles_severity INTEGER DEFAULT 0 CHECK (snakes_reptiles_severity >= 0 AND snakes_reptiles_severity <= 3),
  needles_injections_severity INTEGER DEFAULT 0 CHECK (needles_injections_severity >= 0 AND needles_injections_severity <= 3),
  pregnancy_childbirth_severity INTEGER DEFAULT 0 CHECK (pregnancy_childbirth_severity >= 0 AND pregnancy_childbirth_severity <= 3),
  death_dying_severity INTEGER DEFAULT 0 CHECK (death_dying_severity >= 0 AND death_dying_severity <= 3),
  claustrophobia_triggers_severity INTEGER DEFAULT 0 CHECK (claustrophobia_triggers_severity >= 0 AND claustrophobia_triggers_severity <= 3),
  physical_violence_severity INTEGER DEFAULT 0 CHECK (physical_violence_severity >= 0 AND physical_violence_severity <= 3),
  car_crashes_severity INTEGER DEFAULT 0 CHECK (car_crashes_severity >= 0 AND car_crashes_severity <= 3),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  

CREATE INDEX IF NOT EXISTS idx_overall_triggers_media ON overall_triggers(media_id);

DROP TRIGGER IF EXISTS trigger_overall_triggers_updated_at ON overall_triggers;
CREATE TRIGGER trigger_overall_triggers_updated_at
  BEFORE UPDATE ON overall_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: timestamp_triggers
-- ============================================

    CREATE TABLE IF NOT EXISTS timestamp_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      media_id UUID NOT NULL REFERENCES media_content(internal_id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      start_time INTEGER NOT NULL CHECK (start_time >= 0),
      end_time INTEGER NOT NULL CHECK (end_time >= 0),
      description TEXT,
      submitted_by UUID,
      is_verified BOOLEAN DEFAULT false,
      vote_score INTEGER DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT valid_time_range CHECK (end_time >= start_time),
      CONSTRAINT valid_category CHECK (category IN ('violence', 'blood', 'gore', 'sexual_assault', 'sex', 'self_harm', 'suicide', 'eating_disorders', 'drugs', 'swear_words', 'spiders_snakes', 'animal_cruelty', 'child_abuse', 'children_screaming', 'domestic_violence', 'racial_violence', 'lgbtq_phobia', 'religious_trauma', 'dead_body_body_horror', 'torture', 'murder', 'detonations_bombs', 'medical_procedures', 'vomit', 'flashing_lights', 'jumpscares', 'natural_disasters', 'cannibalism', 'gunshots', 'explosions', 'screams', 'slurs', 'hate_speech', 'threats', 'photosensitivity', 'loud_noises', 'insects_spiders', 'snakes_reptiles', 'needles_injections', 'pregnancy_childbirth', 'death_dying', 'claustrophobia_triggers', 'physical_violence', 'car_crashes'))
    );
  

CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_media ON timestamp_triggers(media_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_category ON timestamp_triggers(category);
CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_time ON timestamp_triggers(media_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_timestamp_triggers_verified ON timestamp_triggers(is_verified) WHERE is_verified = true;

DROP TRIGGER IF EXISTS trigger_timestamp_triggers_updated_at ON timestamp_triggers;
CREATE TRIGGER trigger_timestamp_triggers_updated_at
  BEFORE UPDATE ON timestamp_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: timestamp_votes
-- ============================================

    CREATE TABLE IF NOT EXISTS timestamp_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      timestamp_id UUID NOT NULL REFERENCES timestamp_triggers(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(timestamp_id, user_id)
    );
  

CREATE INDEX IF NOT EXISTS idx_timestamp_votes_timestamp ON timestamp_votes(timestamp_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_votes_user ON timestamp_votes(user_id);

-- ============================================
-- VOTE COUNTING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE timestamp_triggers SET upvotes = upvotes + 1, vote_score = vote_score + 1 WHERE id = NEW.timestamp_id;
    ELSE
      UPDATE timestamp_triggers SET downvotes = downvotes + 1, vote_score = vote_score - 1 WHERE id = NEW.timestamp_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE timestamp_triggers SET upvotes = upvotes - 1, vote_score = vote_score - 1 WHERE id = OLD.timestamp_id;
    ELSE
      UPDATE timestamp_triggers SET downvotes = downvotes - 1, vote_score = vote_score + 1 WHERE id = OLD.timestamp_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF NEW.vote_type = 'up' THEN
        UPDATE timestamp_triggers SET upvotes = upvotes + 1, downvotes = downvotes - 1, vote_score = vote_score + 2 WHERE id = NEW.timestamp_id;
      ELSE
        UPDATE timestamp_triggers SET upvotes = upvotes - 1, downvotes = downvotes + 1, vote_score = vote_score - 2 WHERE id = NEW.timestamp_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_timestamp_votes_update ON timestamp_votes;
CREATE TRIGGER trigger_timestamp_votes_update
  AFTER INSERT OR UPDATE OR DELETE ON timestamp_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp_vote_counts();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE media_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE overall_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamp_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE timestamp_votes ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read access for media_content" ON media_content;
CREATE POLICY "Public read access for media_content"
  ON media_content FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for overall_triggers" ON overall_triggers;
CREATE POLICY "Public read access for overall_triggers"
  ON overall_triggers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for timestamp_triggers" ON timestamp_triggers;
CREATE POLICY "Public read access for timestamp_triggers"
  ON timestamp_triggers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read access for timestamp_votes" ON timestamp_votes;
CREATE POLICY "Public read access for timestamp_votes"
  ON timestamp_votes FOR SELECT
  USING (true);

-- Authenticated users can submit timestamps
DROP POLICY IF EXISTS "Authenticated users can submit timestamps" ON timestamp_triggers;
CREATE POLICY "Authenticated users can submit timestamps"
  ON timestamp_triggers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can manage their own votes
DROP POLICY IF EXISTS "Users can insert their own votes" ON timestamp_votes;
CREATE POLICY "Users can insert their own votes"
  ON timestamp_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own votes" ON timestamp_votes;
CREATE POLICY "Users can update their own votes"
  ON timestamp_votes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own votes" ON timestamp_votes;
CREATE POLICY "Users can delete their own votes"
  ON timestamp_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
SELECT 'Migration completed successfully!' as status;

-- Function to update user points and level
CREATE OR REPLACE FUNCTION update_user_points(user_id UUID, points_to_add INTEGER)
RETURNS void AS $$
DECLARE
  new_total_points INTEGER;
  new_level INTEGER;
BEGIN
  -- Update total points
  UPDATE profiles 
  SET total_points = total_points + points_to_add,
      updated_at = NOW()
  WHERE id = user_id
  RETURNING total_points INTO new_total_points;
  
  -- Calculate new level (every 500 points = 1 level)
  new_level := GREATEST(1, new_total_points / 500 + 1);
  
  -- Update level if changed
  UPDATE profiles 
  SET level = new_level
  WHERE id = user_id AND level != new_level;
  
  -- Update team points
  UPDATE teams 
  SET total_points = (
    SELECT COALESCE(SUM(p.total_points), 0)
    FROM profiles p
    WHERE p.team_id = teams.id
  ),
  updated_at = NOW()
  WHERE id = (SELECT team_id FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to update team member count
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE teams 
    SET member_count = member_count + 1,
        updated_at = NOW()
    WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE teams 
    SET member_count = member_count - 1,
        updated_at = NOW()
    WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update forum post reply count
CREATE OR REPLACE FUNCTION update_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts 
    SET reply_count = reply_count + 1,
        updated_at = NOW()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts 
    SET reply_count = reply_count - 1,
        updated_at = NOW()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE forum_posts 
      SET like_count = like_count + 1
      WHERE id = NEW.post_id;
    ELSIF NEW.reply_id IS NOT NULL THEN
      UPDATE forum_replies 
      SET like_count = like_count + 1
      WHERE id = NEW.reply_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE forum_posts 
      SET like_count = like_count - 1
      WHERE id = OLD.post_id;
    ELSIF OLD.reply_id IS NOT NULL THEN
      UPDATE forum_replies 
      SET like_count = like_count - 1
      WHERE id = OLD.reply_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update event participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET current_participants = current_participants + 1,
        updated_at = NOW()
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET current_participants = current_participants - 1,
        updated_at = NOW()
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user rank
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_users AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) as new_rank
    FROM profiles
    WHERE total_points > 0
  )
  UPDATE profiles 
  SET rank = ranked_users.new_rank
  FROM ranked_users
  WHERE profiles.id = ranked_users.id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team ranks
CREATE OR REPLACE FUNCTION update_team_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_teams AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, created_at ASC) as new_rank
    FROM teams
    WHERE total_points > 0
  )
  UPDATE teams 
  SET rank = ranked_teams.new_rank
  FROM ranked_teams
  WHERE teams.id = ranked_teams.id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (p_user_id, p_title, p_message, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to award badge
CREATE OR REPLACE FUNCTION award_badge(p_user_id UUID, p_badge_id UUID, p_challenge_id UUID DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  badge_name TEXT;
BEGIN
  -- Check if user already has this badge
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN false;
  END IF;
  
  -- Award the badge
  INSERT INTO user_badges (user_id, badge_id, challenge_id)
  VALUES (p_user_id, p_badge_id, p_challenge_id);
  
  -- Get badge name for notification
  SELECT name INTO badge_name FROM badges WHERE id = p_badge_id;
  
  -- Create notification
  PERFORM create_notification(
    p_user_id,
    'New Badge Earned!',
    'Congratulations! You earned the ' || badge_name || ' badge.',
    'badge',
    jsonb_build_object('badge_id', p_badge_id, 'badge_name', badge_name)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile for the new user
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name', -- Assumes 'full_name' is passed in metadata on signup
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate team member counts
CREATE OR REPLACE FUNCTION recalculate_team_member_counts()
RETURNS void AS $$
BEGIN
  UPDATE teams 
  SET member_count = (
    SELECT COUNT(*) 
    FROM team_members 
    WHERE team_members.team_id = teams.id
  ),
  updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update a specific team's member count
CREATE OR REPLACE FUNCTION update_specific_team_member_count(team_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE teams 
  SET member_count = (
    SELECT COUNT(*) 
    FROM team_members 
    WHERE team_members.team_id = team_id_param
  ),
  updated_at = NOW()
  WHERE id = team_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to sync all team member counts (fix inconsistencies)
CREATE OR REPLACE FUNCTION sync_all_team_member_counts()
RETURNS void AS $$
BEGIN
  -- Update all teams with correct member counts
  UPDATE teams 
  SET member_count = (
    SELECT COUNT(*) 
    FROM team_members 
    WHERE team_members.team_id = teams.id
  ),
  updated_at = NOW();
  
  -- Log the sync operation
  RAISE NOTICE 'Synced member counts for all teams';
END;
$$ LANGUAGE plpgsql;

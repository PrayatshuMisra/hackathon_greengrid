-- View for user leaderboard with team info
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.avatar_url,
  p.city,
  p.total_points,
  p.level,
  p.rank,
  t.name as team_name,
  t.id as team_id,
  COUNT(ub.id) as badge_count,
  COUNT(uc.id) as completed_challenges
FROM profiles p
LEFT JOIN teams t ON p.team_id = t.id
LEFT JOIN user_badges ub ON p.id = ub.user_id
LEFT JOIN user_challenges uc ON p.id = uc.user_id AND uc.status = 'completed'
GROUP BY p.id, p.name, p.email, p.avatar_url, p.city, p.total_points, p.level, p.rank, t.name, t.id
ORDER BY p.total_points DESC, p.created_at ASC;

-- View for team leaderboard with member info
CREATE OR REPLACE VIEW team_leaderboard AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.city,
  t.total_points,
  t.rank,
  t.member_count,
  t.created_at,
  COUNT(DISTINCT uc.id) as total_challenges_completed,
  COUNT(DISTINCT ub.id) as total_badges_earned,
  AVG(p.total_points) as avg_member_points
FROM teams t
LEFT JOIN profiles p ON t.id = p.team_id
LEFT JOIN user_challenges uc ON p.id = uc.user_id AND uc.status = 'completed'
LEFT JOIN user_badges ub ON p.id = ub.user_id
GROUP BY t.id, t.name, t.description, t.city, t.total_points, t.rank, t.member_count, t.created_at
ORDER BY t.total_points DESC, t.created_at ASC;

-- View for challenge statistics
CREATE OR REPLACE VIEW challenge_stats AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.points,
  c.difficulty,
  cc.name as category_name,
  cc.icon as category_icon,
  COUNT(uc.id) as total_participants,
  COUNT(CASE WHEN uc.status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN uc.status = 'active' THEN 1 END) as active_count,
  ROUND(
    COUNT(CASE WHEN uc.status = 'completed' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(uc.id), 0), 2
  ) as completion_rate
FROM challenges c
LEFT JOIN challenge_categories cc ON c.category_id = cc.id
LEFT JOIN user_challenges uc ON c.id = uc.challenge_id
WHERE c.is_active = true
GROUP BY c.id, c.title, c.description, c.points, c.difficulty, cc.name, cc.icon
ORDER BY total_participants DESC;

-- View for user activity feed
CREATE OR REPLACE VIEW user_activity_feed AS
SELECT 
  ua.id,
  ua.user_id,
  p.name as user_name,
  p.avatar_url,
  ua.activity_type,
  ua.description,
  ua.points_earned,
  ua.created_at,
  CASE 
    WHEN ua.related_type = 'challenge' THEN c.title
    WHEN ua.related_type = 'event' THEN e.title
    WHEN ua.related_type = 'badge' THEN b.name
    ELSE NULL
  END as related_title
FROM user_activity ua
JOIN profiles p ON ua.user_id = p.id
LEFT JOIN challenges c ON ua.related_id = c.id AND ua.related_type = 'challenge'
LEFT JOIN events e ON ua.related_id = e.id AND ua.related_type = 'event'
LEFT JOIN badges b ON ua.related_id = b.id AND ua.related_type = 'badge'
ORDER BY ua.created_at DESC;

-- View for nearby events (requires location)
CREATE OR REPLACE VIEW nearby_events AS
SELECT 
  e.*,
  ep.user_id as is_registered,
  CASE 
    WHEN e.latitude IS NOT NULL AND e.longitude IS NOT NULL 
    THEN ST_Distance(
      ST_Point(e.longitude, e.latitude)::geography,
      ST_Point(0, 0)::geography -- This would be replaced with user's location in queries
    ) / 1000 -- Convert to kilometers
    ELSE NULL 
  END as distance_km
FROM events e
LEFT JOIN event_participants ep ON e.id = ep.event_id
WHERE e.start_date > NOW()
ORDER BY e.start_date ASC;

-- View for forum posts with author info
CREATE OR REPLACE VIEW forum_posts_with_author AS
SELECT 
  fp.id,
  fp.title,
  fp.content,
  fp.reply_count,
  fp.like_count,
  fp.is_pinned,
  fp.created_at,
  fp.updated_at,
  p.name as author_name,
  p.avatar_url as author_avatar,
  fc.name as category_name,
  fc.icon as category_icon,
  fc.color as category_color
FROM forum_posts fp
JOIN profiles p ON fp.author_id = p.id
JOIN forum_categories fc ON fp.category_id = fc.id
WHERE fp.is_locked = false
ORDER BY fp.is_pinned DESC, fp.created_at DESC;

-- View for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  p.id as user_id,
  p.total_points,
  p.level,
  p.rank,
  COUNT(DISTINCT uc.id) FILTER (WHERE uc.status = 'completed') as challenges_completed,
  COUNT(DISTINCT ub.id) as badges_earned,
  COUNT(DISTINCT ep.id) as events_attended,
  COALESCE(SUM(CASE WHEN ua.activity_type = 'co2_saved' THEN ua.points_earned END), 0) as co2_saved,
  COALESCE(SUM(CASE WHEN ua.activity_type = 'water_saved' THEN ua.points_earned END), 0) as water_saved,
  COALESCE(SUM(CASE WHEN ua.activity_type = 'plastic_avoided' THEN ua.points_earned END), 0) as plastic_avoided,
  COALESCE(SUM(CASE WHEN ua.activity_type = 'trees_planted' THEN ua.points_earned END), 0) as trees_planted
FROM profiles p
LEFT JOIN user_challenges uc ON p.id = uc.user_id
LEFT JOIN user_badges ub ON p.id = ub.user_id
LEFT JOIN event_participants ep ON p.id = ep.user_id AND ep.status = 'attended'
LEFT JOIN user_activity ua ON p.id = ua.user_id
GROUP BY p.id, p.total_points, p.level, p.rank;

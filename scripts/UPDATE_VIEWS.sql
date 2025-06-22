-- Update team_leaderboard view to calculate member_count dynamically
DROP VIEW IF EXISTS team_leaderboard;

CREATE OR REPLACE VIEW team_leaderboard AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.city,
  t.total_points,
  t.rank,
  COUNT(DISTINCT p.id) as member_count,
  t.created_at,
  COUNT(DISTINCT uc.id) as total_challenges_completed,
  COUNT(DISTINCT ub.id) as total_badges_earned,
  AVG(p.total_points) as avg_member_points
FROM teams t
LEFT JOIN profiles p ON t.id = p.team_id
LEFT JOIN user_challenges uc ON p.id = uc.user_id AND uc.status = 'completed'
LEFT JOIN user_badges ub ON p.id = ub.user_id
GROUP BY t.id, t.name, t.description, t.city, t.total_points, t.rank, t.created_at
ORDER BY t.total_points DESC, t.created_at ASC; 
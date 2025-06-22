-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams policies
CREATE POLICY "Users can view all teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Team admins can update team" ON teams FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = teams.id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Team members policies
CREATE POLICY "Users can view team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team admins can manage members" ON team_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = team_members.team_id 
    AND tm.user_id = auth.uid() 
    AND tm.role = 'admin'
  )
);
CREATE POLICY "Users can join teams" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Users can view active challenges" ON challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage challenges" ON challenges FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (email LIKE '%@greengrid.admin' OR id = created_by)
  )
);

-- User challenges policies
CREATE POLICY "Users can view own challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own challenges" ON user_challenges FOR ALL USING (auth.uid() = user_id);

-- Challenge submissions policies
CREATE POLICY "Users can view own submissions" ON challenge_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own submissions" ON challenge_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON challenge_submissions FOR UPDATE USING (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Users can view all badges" ON badges FOR SELECT USING (true);

-- User badges policies
CREATE POLICY "Users can view all user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can award badges" ON user_badges FOR INSERT WITH CHECK (true);

-- Events policies
CREATE POLICY "Users can view all events" ON events FOR SELECT USING (true);
CREATE POLICY "Event organizers can manage events" ON events FOR ALL USING (auth.uid() = organizer_id);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Event participants policies
CREATE POLICY "Users can view event participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Users can manage own participation" ON event_participants FOR ALL USING (auth.uid() = user_id);

-- Forum policies
CREATE POLICY "Users can view forum categories" ON forum_categories FOR SELECT USING (true);
CREATE POLICY "Users can view forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can view forum replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own replies" ON forum_replies FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can manage own likes" ON forum_likes FOR ALL USING (auth.uid() = user_id);

-- Rewards policies
CREATE POLICY "Users can view active rewards" ON rewards FOR SELECT USING (is_active = true);

-- User rewards policies
CREATE POLICY "Users can view own rewards" ON user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can redeem rewards" ON user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- User activity policies
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create activity" ON user_activity FOR INSERT WITH CHECK (true);

-- Team invitations policies
CREATE POLICY "Users can view team invitations for their teams" ON team_invitations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_invitations.team_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY "Team admins can create invitations" ON team_invitations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_invitations.team_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);
CREATE POLICY "Users can update their own invitations" ON team_invitations FOR UPDATE USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);

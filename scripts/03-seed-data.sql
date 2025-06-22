-- Insert challenge categories
INSERT INTO challenge_categories (name, description, icon, color) VALUES
('Energy', 'Reduce energy consumption and promote renewable energy', '⚡', '#FCD34D'),
('Transportation', 'Promote eco-friendly transportation methods', '🚲', '#60A5FA'),
('Waste Reduction', 'Minimize waste and promote recycling', '♻️', '#34D399'),
('Water', 'Conserve water and protect water resources', '💧', '#06B6D4'),
('Food', 'Promote sustainable food practices', '🌱', '#FB7185'),
('Air Quality', 'Improve air quality and reduce pollution', '🌬️', '#A78BFA')
ON CONFLICT (name) DO NOTHING;

-- Insert sample challenges
INSERT INTO challenges (title, description, category_id, points, difficulty, challenge_type, duration_days, verification_required) VALUES
(
  'Plastic-Free Week Challenge',
  'Avoid single-use plastics for 7 consecutive days. Document your plastic-free meals, shopping, and daily activities.',
  (SELECT id FROM challenge_categories WHERE name = 'Waste Reduction'),
  150,
  'Medium',
  'plastic-free',
  7,
  true
),
(
  'Bike to Work/School',
  'Use bicycle for daily commute for 5 days. Take photos of yourself with your bike at different locations.',
  (SELECT id FROM challenge_categories WHERE name = 'Transportation'),
  200,
  'Easy',
  'bike-commute',
  5,
  true
),
(
  'Energy Saver Challenge',
  'Reduce electricity consumption by 20% compared to previous month. Upload your electricity bills for verification.',
  (SELECT id FROM challenge_categories WHERE name = 'Energy'),
  300,
  'Hard',
  'energy-bill',
  30,
  true
),
(
  'Home Composting',
  'Start composting kitchen waste. Document your compost setup and progress over 2 weeks.',
  (SELECT id FROM challenge_categories WHERE name = 'Waste Reduction'),
  180,
  'Medium',
  'composting',
  14,
  true
),
(
  'Grow Your Own Herbs',
  'Plant and maintain a small herb garden. Share photos of your growing plants.',
  (SELECT id FROM challenge_categories WHERE name = 'Food'),
  120,
  'Easy',
  'plant-growing',
  21,
  true
),
(
  'Water Conservation',
  'Reduce water usage by 15% compared to previous month. Upload water bills for verification.',
  (SELECT id FROM challenge_categories WHERE name = 'Water'),
  250,
  'Medium',
  'water-bill',
  30,
  true
)
ON CONFLICT DO NOTHING;

-- Insert badges with specific IDs for easy reference
INSERT INTO badges (id, name, description, icon, rarity, points_required) VALUES
('plastic-free-warrior-badge-id', 'Plastic-Free Warrior', 'Completed plastic-free challenges', '🛡️', 'Epic', 500),
('energy-saver-badge-id', 'Energy Saver', 'Reduced energy consumption significantly', '⚡', 'Rare', 300),
('water-guardian-badge-id', 'Water Guardian', 'Conserved water resources', '💧', 'Legendary', 1000),
('green-commuter-badge-id', 'Green Commuter', 'Used eco-friendly transportation', '🚲', 'Common', 100),
('compost-champion-badge-id', 'Compost Champion', 'Successfully composted organic waste', '🌱', 'Rare', 400),
('tree-planter-badge-id', 'Tree Planter', 'Participated in tree planting activities', '🌳', 'Epic', 600),
('climate-champion-badge-id', 'Climate Champion', 'Reached level 5 in eco-actions', '🏆', 'Legendary', 2000),
('eco-educator-badge-id', 'Eco Educator', 'Shared knowledge and helped others', '📚', 'Epic', 800),
('renewable-energy-advocate-badge-id', 'Renewable Energy Advocate', 'Promoted renewable energy solutions', '☀️', 'Rare', 500),
('zero-waste-hero-badge-id', 'Zero Waste Hero', 'Achieved minimal waste lifestyle', '🗑️', 'Legendary', 1500)
ON CONFLICT (name) DO NOTHING;

-- Insert forum categories
INSERT INTO forum_categories (name, description, icon, color) VALUES
('Tips & Tricks', 'Share practical eco-friendly tips and tricks', '💡', '#FCD34D'),
('Success Stories', 'Celebrate eco-achievements and inspire others', '🎉', '#34D399'),
('Q&A', 'Ask questions and get help from the community', '❓', '#60A5FA'),
('Local Events', 'Organize and discover local eco-events', '📅', '#FB7185'),
('Product Reviews', 'Review eco-friendly products and services', '⭐', '#A78BFA'),
('Challenges', 'Discuss ongoing challenges and strategies', '🎯', '#F97316')
ON CONFLICT (name) DO NOTHING;

-- Insert sample teams
INSERT INTO teams (name, description, city, total_points, member_count, max_members, invite_code, created_by) VALUES
(
  'EcoWarriors Delhi',
  'A passionate group of environmentalists working to make Delhi greener',
  'Delhi',
  4580,
  24,
  50,
  'DELHI2024',
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Green Mumbai',
  'Mumbai-based team focused on coastal cleanup and marine conservation',
  'Mumbai',
  3200,
  18,
  40,
  'MUMBAI2024',
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Bangalore Eco Squad',
  'Tech-savvy environmentalists using innovation for sustainability',
  'Bangalore',
  2800,
  15,
  35,
  'BLR2024',
  (SELECT id FROM profiles LIMIT 1)
)
ON CONFLICT (invite_code) DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, event_type, start_date, end_date, location, city, max_participants, organizer_id) VALUES
(
  'Community Tree Plantation Drive',
  'Join us for a massive tree plantation drive in Central Park. Help us plant 1000 trees and make Delhi greener.',
  'tree_planting',
  '2025-07-15 09:00:00+05:30',
  '2025-07-15 17:00:00+05:30',
  'Central Park, Delhi',
  'Delhi',
  100,
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Plastic-Free Workshop',
  'Learn practical tips to reduce plastic usage in daily life. Interactive session with experts.',
  'workshop',
  '2025-07-18 14:00:00+05:30',
  '2025-07-18 16:00:00+05:30',
  'Online Event',
  'Virtual',
  200,
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Beach Cleanup Drive',
  'Help clean up Juhu Beach and protect marine life. All equipment provided.',
  'cleanup',
  '2025-07-20 07:00:00+05:30',
  '2025-07-20 11:00:00+05:30',
  'Juhu Beach, Mumbai',
  'Mumbai',
  50,
  (SELECT id FROM profiles LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Insert sample forum posts
INSERT INTO forum_posts (title, content, category_id, author_id) VALUES
(
  'How to start composting at home',
  'I recently started composting and wanted to share my experience. Here are some easy steps to get started...',
  (SELECT id FROM forum_categories WHERE name = 'Tips & Tricks'),
  (SELECT id FROM profiles LIMIT 1)
),
(
  'My plastic-free journey - 30 days completed!',
  'Just completed 30 days of plastic-free living. Here are the challenges I faced and how I overcame them...',
  (SELECT id FROM forum_categories WHERE name = 'Success Stories'),
  (SELECT id FROM profiles LIMIT 1)
),
(
  'Best eco-friendly water bottles?',
  'Looking for recommendations for durable, eco-friendly water bottles. Any suggestions?',
  (SELECT id FROM forum_categories WHERE name = 'Q&A'),
  (SELECT id FROM profiles LIMIT 1)
)
ON CONFLICT DO NOTHING;

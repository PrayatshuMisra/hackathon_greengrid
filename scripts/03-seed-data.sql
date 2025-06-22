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

-- Insert badges
INSERT INTO badges (name, description, icon, rarity, points_required) VALUES
('Plastic-Free Warrior', 'Completed plastic-free challenges', '🛡️', 'Epic', 500),
('Energy Saver', 'Reduced energy consumption significantly', '⚡', 'Rare', 300),
('Water Guardian', 'Conserved water resources', '💧', 'Legendary', 1000),
('Green Commuter', 'Used eco-friendly transportation', '🚲', 'Common', 100),
('Compost Champion', 'Successfully composted organic waste', '🌱', 'Rare', 400),
('Tree Planter', 'Participated in tree planting activities', '🌳', 'Epic', 600),
('Climate Champion', 'Reached level 5 in eco-actions', '🏆', 'Legendary', 2000),
('Eco Educator', 'Shared knowledge and helped others', '📚', 'Epic', 800),
('Renewable Energy Advocate', 'Promoted renewable energy solutions', '☀️', 'Rare', 500),
('Zero Waste Hero', 'Achieved minimal waste lifestyle', '🗑️', 'Legendary', 1500)
ON CONFLICT (name) DO NOTHING;

-- Insert forum categories
INSERT INTO forum_categories (name, description, icon, color) VALUES
('Tips & Tricks', 'Share practical eco-friendly tips and tricks', '💡', '#FCD34D'),
('Success Stories', 'Celebrate eco-achievements and inspire others', '🎉', '#34D399'),
('Q&A', 'Ask questions and get help from the community', '❓', '#60A5FA'),
('Local Events', 'Organize and discover local eco-events', '📅', '#FB7185'),
('Product Reviews', 'Review eco-friendly products and services', '⭐', '#A78BFA'),
('Policy & News', 'Discuss environmental policies and news', '📰', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Insert sample rewards
INSERT INTO rewards (name, description, category, points_cost, brand, validity_days, discount_percentage) VALUES
('Plant 1 Tree', 'Plant one tree through our partner NGO', 'donation', 100, 'Green India Foundation', 365, NULL),
('Plant 5 Trees', 'Plant five trees and get a certificate', 'donation', 450, 'Forest Revival NGO', 365, NULL),
('Organic Store 20% Off', 'Get 20% discount on organic products', 'coupon', 300, 'Nature''s Basket', 30, 20),
('Solar Panel 15% Discount', 'Discount on solar panel installation', 'coupon', 1500, 'SunPower India', 60, 15),
('Bamboo Water Bottle', 'Sustainable bamboo water bottle', 'product', 600, 'EcoLife', 365, NULL),
('Solar Power Bank', 'Portable solar power bank', 'product', 1200, 'GreenTech', 365, NULL),
('Climate Hero Badge', 'Digital achievement badge NFT', 'nft', 500, 'GreenGrid', 365, NULL),
('Eco Warrior Certificate', 'Verified eco-action certificate NFT', 'nft', 800, 'GreenGrid', 365, NULL)
ON CONFLICT DO NOTHING;

-- Insert sample teams
INSERT INTO teams (name, description, city, invite_code, total_points, rank, member_count) VALUES
('EcoWarriors Delhi', 'Passionate eco-warriors from Delhi working together for a sustainable future', 'Delhi', 'ECODEL001', 4580, 1, 24),
('Green Guardians Mumbai', 'Mumbai''s dedicated environmental protection team', 'Mumbai', 'GREENMUM002', 4320, 2, 31),
('Bangalore Bikers', 'Promoting cycling and sustainable transport in Bangalore', 'Bangalore', 'BIKEBNG003', 3890, 3, 18),
('Chennai Champions', 'Climate action champions from Chennai', 'Chennai', 'CHAMCHE004', 3650, 4, 22),
('Pune Planet Savers', 'Saving the planet one action at a time from Pune', 'Pune', 'PUNPLA005', 3420, 5, 27),
('Hyderabad Eco Heroes', 'Environmental heroes making a difference in Hyderabad', 'Hyderabad', 'HYDECOHER006', 3210, 6, 19)
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, event_type, organizer_name, start_date, end_date, location_name, city, latitude, longitude, max_participants, points_reward) VALUES
(
  'Community Tree Plantation Drive',
  'Join us for a massive tree plantation drive in Central Park. We aim to plant 100 native trees.',
  'plantation',
  'Green Delhi Initiative',
  '2024-12-15 09:00:00+05:30',
  '2024-12-15 12:00:00+05:30',
  'Central Park',
  'Delhi',
  28.6304,
  77.2177,
  100,
  50
),
(
  'Plastic-Free Workshop',
  'Learn practical tips to live plastic-free. Interactive workshop with hands-on activities.',
  'workshop',
  'Zero Waste India',
  '2024-12-18 14:00:00+05:30',
  '2024-12-18 17:00:00+05:30',
  'Online Event',
  'Online',
  NULL,
  NULL,
  200,
  30
),
(
  'Solar Energy Awareness Session',
  'Understanding solar energy benefits and installation process.',
  'awareness',
  'Renewable Energy Forum',
  '2024-12-22 14:00:00+05:30',
  '2024-12-22 16:00:00+05:30',
  'Tech Hub',
  'Bangalore',
  12.9716,
  77.5946,
  75,
  40
),
(
  'Beach Cleanup Drive',
  'Clean up Juhu Beach and protect marine life.',
  'cleanup',
  'Ocean Warriors Mumbai',
  '2024-12-20 07:00:00+05:30',
  '2024-12-20 10:00:00+05:30',
  'Juhu Beach',
  'Mumbai',
  19.1075,
  72.8263,
  150,
  60
)
ON CONFLICT DO NOTHING;

-- Seed challenge_submissions using existing user_challenges
INSERT INTO challenge_submissions (
  user_challenge_id,
  user_id,
  challenge_id,
  submission_type,
  file_url,
  description,
  verification_status,
  submitted_at
)
SELECT
  uc.id,
  uc.user_id,
  uc.challenge_id,
  'image',
  'https://example.com/proof.jpg',
  'Demo proof submission for admin verification',
  'pending',
  NOW()
FROM user_challenges uc
LIMIT 5;

-- GreenGrid Database Setup Script
-- This script sets up the complete database schema and initial data

-- Run all setup scripts in order
\i scripts/01-create-tables.sql
\i scripts/02-create-rls-policies.sql
\i scripts/03-seed-data.sql
\i scripts/04-create-functions.sql
\i scripts/05-create-triggers.sql
\i scripts/06-create-views.sql

-- Display setup completion message
SELECT 'GreenGrid database setup completed successfully!' as status; 
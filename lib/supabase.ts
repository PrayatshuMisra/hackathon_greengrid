import { createClient } from "@supabase/supabase-js"

// These values should be replaced with environment variables in production
const supabaseUrl = "https://dhqykshqkyufxbkoyvvw.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocXlrc2hxa3l1Znhia295dnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTI0MjgsImV4cCI6MjA2NTMyODQyOH0.OQjQbmMetMKXUOgJm03QNHFYSw6quV8gztnVjP_narU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

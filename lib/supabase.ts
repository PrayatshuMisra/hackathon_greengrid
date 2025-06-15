import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://lenuuxzhvadftlfbozox.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbnV1eHpodmFkZnRsZmJvem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMzNjIsImV4cCI6MjA2NTU0OTM2Mn0.YOVr0cGaVyp7APpi4QkimMFjT6DZmyBlNuZMed3STN8"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

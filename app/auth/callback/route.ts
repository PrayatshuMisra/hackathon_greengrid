import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
      supabaseUrl: "https://dhqykshqkyufxbkoyvvw.supabase.co",
      supabaseKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocXlrc2hxa3l1Znhia295dnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTI0MjgsImV4cCI6MjA2NTMyODQyOH0.OQjQbmMetMKXUOgJm03QNHFYSw6quV8gztnVjP_narU",
    })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const supabaseUrl = "https://lenuuxzhvadftlfbozox.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbnV1eHpodmFkZnRsZmJvem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMzNjIsImV4cCI6MjA2NTU0OTM2Mn0.YOVr0cGaVyp7APpi4QkimMFjT6DZmyBlNuZMed3STN8"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res }, {
    supabaseUrl,
    supabaseKey: supabaseAnonKey
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isDemo = req.cookies.get("demo")?.value === "true" || req.nextUrl.searchParams.get("demo") === "true"

  if (!session && !isDemo && !isAuthPage && req.nextUrl.pathname !== "/") {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/auth/login"
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth|public).*)",
  ],
}

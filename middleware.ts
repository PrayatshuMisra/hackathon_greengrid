import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res });


  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if the user is authenticated
  // If not authenticated and trying to access protected routes
const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
const isDemo = req.cookies.get("demo")?.value === "true" || req.nextUrl.searchParams.get("demo") === "true";
if (!session && !isDemo && !isAuthPage && req.nextUrl.pathname !== "/") {
  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = "/auth/login"
  redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
  return NextResponse.redirect(redirectUrl)
}


  // If authenticated and trying to access auth pages
  if (session && isAuthPage) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

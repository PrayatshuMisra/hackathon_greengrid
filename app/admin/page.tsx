"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Eye, EyeOff, Lock, User, Leaf } from "lucide-react"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const adminSession = localStorage.getItem("admin_session")
        if (adminSession) {
          const session = JSON.parse(adminSession)
          if (session.email === "admin@greengrid.com" && session.role === "admin") {
            const loginTime = new Date(session.loginTime)
            const now = new Date()
            const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
            if (hoursDiff < 24) {
              setIsAuthenticated(true)
              router.push("/admin/dashboard")
              return
            }
          }
        }
        setIsAuthenticated(false)
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (email === "admin@greengrid.com" && password === "GreenGrid2025!!") {
      const adminSession = {
        email: "admin@greengrid.com",
        role: "admin",
        loginTime: new Date().toISOString(),
      }
      localStorage.setItem("admin_session", JSON.stringify(adminSession))
      setIsAuthenticated(true)
      router.push("/admin/dashboard")
    } else {
      setError("Invalid credentials. Please check your email and password.")
    }

    setIsLoading(false)
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-500 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800 mx-auto"></div>
          <p className="mt-4 text-green-900">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-500 to-white p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">Admin Login</CardTitle>
          <CardDescription className="text-green-600">Enter your admin credentials to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Admin Email-Id.."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                "Access Admin Panel"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium mb-2">Need access?</p>
            <p className="text-xs text-green-600 italic">
              Only tree-huggers and carbon-busters allowed 🍃
            </p>
            <button
              onClick={() => setShowEasterEgg(!showEasterEgg)}
              className="mt-2 text-xs text-green-800 underline hover:text-green-600 transition-all"
            >
              <Leaf className="inline h-4 w-4 mr-1" />
              Hint?
            </button>
            {showEasterEgg && (
              <div className="mt-2 text-xs text-green-700 font-mono">
                Email: <strong>admin@greengrid.com</strong><br />
                Password: <strong><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"><u>Get it here</u></a></strong><br />
                <span className="text-green-500">P.S. Don’t tell the trees. 🤫</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

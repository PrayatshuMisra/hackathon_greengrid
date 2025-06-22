"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { RealtimeProvider } from "@/lib/realtime"
import { GeolocationProvider } from "@/lib/geolocation"
import { AIProvider } from "@/lib/ai-verification"
import { ToastProvider } from "@/components/ui/toast"
import { ThemeProvider } from "@/contexts/theme-context"

const supabaseUrl = "https://lenuuxzhvadftlfbozox.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbnV1eHpodmFkZnRsZmJvem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMzNjIsImV4cCI6MjA2NTU0OTM2Mn0.YOVr0cGaVyp7APpi4QkimMFjT6DZmyBlNuZMed3STN8"

const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey
})

interface User {
  user_metadata: any
  id: string
  name: string
  email: string
  avatar_url: string | null
  team_id: string | null
  location: { lat: number; lng: number; city: string } | null
  total_points: number
  level: number
  rank: number
}

interface AppContextType {
  user: User | null
  supabase: any
  loading: boolean
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextType>({
  user: null,
  supabase,
  loading: true,
  signOut: async () => {}, // fallback
})

export const useApp = () => useContext(AppContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    const getUser = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (error && error.code !== "PGRST116") {
            console.error("Error fetching user profile:", error)
            throw error
          }

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              avatar_url: profile.avatar_url,
              team_id: profile.team_id,
              location: {
                lat: profile.latitude || 28.6139,
                lng: profile.longitude || 77.209,
                city: profile.city || "Delhi",
              },
              total_points: profile.total_points || 0,
              level: profile.level || 1,
              rank: profile.rank || 0,
              user_metadata: session.user.user_metadata || {},
            })
          } else {
            const userData = {
              id: session.user.id,
              email: session.user.email || "",
              name:
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0] ||
                "User",
              avatar_url: session.user.user_metadata?.avatar_url || null,
              total_points: 0,
              level: 1,
              user_metadata: session.user.user_metadata || {},
            }

            const { error: insertError } = await supabase
              .from("profiles")
              .insert(userData)

            if (insertError) {
              console.error("Error creating user profile:", insertError)
            } else {
              setUser({
                ...userData,
                team_id: null,
                location: {
                  lat: 28.6139,
                  lng: 77.209,
                  city: "Delhi",
                },
                rank: 0,
              })
            }
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error in auth flow:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        getUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <ThemeProvider>
      <AppContext.Provider value={{ user, supabase, loading, signOut }}>
        <ToastProvider>
          <RealtimeProvider>
            <GeolocationProvider>
              <AIProvider>{children}</AIProvider>
            </GeolocationProvider>
          </RealtimeProvider>
        </ToastProvider>
      </AppContext.Provider>
    </ThemeProvider>
  )
}

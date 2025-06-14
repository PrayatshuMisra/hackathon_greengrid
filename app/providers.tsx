"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { RealtimeProvider } from "@/lib/realtime"
import { GeolocationProvider } from "@/lib/geolocation"
import { AIProvider } from "@/lib/ai-verification"
import { ToastProvider } from "@/components/ui/toast"

const supabase = createClientComponentClient({
  supabaseUrl: "https://dhqykshqkyufxbkoyvvw.supabase.co",
  supabaseKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocXlrc2hxa3l1Znhia295dnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NTI0MjgsImV4cCI6MjA2NTMyODQyOH0.OQjQbmMetMKXUOgJm03QNHFYSw6quV8gztnVjP_narU",
})

interface User {
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
}

const AppContext = createContext<AppContextType>({
  user: null,
  supabase,
  loading: true,
})

export const useApp = () => useContext(AppContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current user session
    const getUser = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Fetch user profile from database
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
            })
          } else {
            // If profile doesn't exist yet, create one
            const userData = {
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User",
              avatar_url: session.user.user_metadata?.avatar_url || null,
              total_points: 0,
              level: 1,
            }

            const { error: insertError } = await supabase.from("profiles").insert(userData)

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

    // Listen for auth changes
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
    <AppContext.Provider value={{ user, supabase, loading }}>
      <ToastProvider>
        <RealtimeProvider>
          <GeolocationProvider>
            <AIProvider>{children}</AIProvider>
          </GeolocationProvider>
        </RealtimeProvider>
      </ToastProvider>
    </AppContext.Provider>
  )
}

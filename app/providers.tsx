"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { RealtimeProvider } from "@/lib/realtime"
import { GeolocationProvider } from "@/lib/geolocation"
import { AIProvider } from "@/lib/ai-verification"
import { ToastProvider } from "@/components/ui/toast"
import { ThemeProvider } from "@/contexts/theme-context"
import { useToast } from "@/hooks/use-toast"
import { useRealtime } from "@/lib/realtime"

const supabase = createClientComponentClient({
  supabaseUrl: "https://lenuuxzhvadftlfbozox.supabase.co",
  supabaseKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbnV1eHpodmFkZnRsZmJvem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMzNjIsImV4cCI6MjA2NTU0OTM2Mn0.YOVr0cGaVyp7APpi4QkimMFjT6DZmyBlNuZMed3STN8",
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
  isDemo?: boolean
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

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const signOut = async () => {

    if (typeof document !== 'undefined') {
      document.cookie = "demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  useEffect(() => {
    const fetchOrCreateProfile = async (sessionUser: any, retries = 5) => {
      let profile, profileError;
      for (let attempt = 0; attempt < retries; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();
        profile = data;
        profileError = error;
        if (profile && !profileError) break;
        // If not found, try to create
        if (attempt === 0) {
          const userData = {
            id: sessionUser.id,
            email: sessionUser.email || "",
            name:
              sessionUser.user_metadata?.full_name ||
              sessionUser.user_metadata?.name ||
              sessionUser.email?.split("@")[0] ||
              "User",
            avatar_url: sessionUser.user_metadata?.avatar_url || null,
            total_points: 0,
            level: 1,
            user_metadata: sessionUser.user_metadata || {},
          };
          await supabase.from("profiles").insert(userData);
        }
        // Wait before retrying
        await new Promise((res) => setTimeout(res, 1200));
      }
      // Final fetch to ensure profile exists
      if (!profile) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();
        profile = data;
      }
      return profile;
    };

    const getUser = async () => {
      setLoading(true)
      try {
        console.log("getUser function called");

        const isDemo = getCookie('demo') === 'true'
        console.log("Demo cookie check:", isDemo);
        
        if (isDemo) {
          console.log("Creating demo user object");

          const demoUser: User = {
            id: 'demo-user-id',
            name: 'Demo User',
            email: 'demo@greengrid.com',
            avatar_url: null,
            team_id: null,
            location: {
              lat: 28.6139,
              lng: 77.209,
              city: "Delhi",
            },
            total_points: 1250,
            level: 3,
            rank: 15,
            user_metadata: {},
            isDemo: true,
          }
          setUser(demoUser)
          setLoading(false)
          return
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("Supabase session:", session);

        if (session?.user) {
          console.log("Session user found:", session.user);
          // Always fetch or create profile robustly
          const profile = await fetchOrCreateProfile(session.user, 3);
          if (profile) {
            setUser({
              ...profile,
              user_metadata: session.user.user_metadata || {},
              isDemo: false,
            })
          } else {
            console.log("Profile doesn't exist, creating new profile");
            const userData = {
              id: session.user.id,
              email: session.user.email || "",
              name:
                session.user.user_metadata?.full_name ||
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

            console.log("Profile creation result:", { insertError });

            if (insertError) {
              console.error("Error creating user profile:", insertError)
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                name: "User",
                avatar_url: null,
                total_points: 0,
                level: 1,
                user_metadata: session.user.user_metadata || {},
                team_id: null,
                location: {
                  lat: 28.6139,
                  lng: 77.209,
                  city: "Delhi",
                },
                rank: 0,
                isDemo: false,
              })
            } else {
              console.log("Setting user from newly created profile");
              setUser({
                ...userData,
                team_id: null,
                location: {
                  lat: 28.6139,
                  lng: 77.209,
                  city: "Delhi",
                },
                rank: 0,
                isDemo: false,
              })
            }
          }
        } else {
          console.log("No session found, setting user to null");
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
      console.log("Auth state change:", event, session);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        getUser()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id || user.isDemo) return;

    const profileChannel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setUser((prevUser: any) => ({ ...prevUser, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user?.id, user?.isDemo, supabase]);

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

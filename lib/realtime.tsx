"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useApp } from "@/app/providers"

interface RealtimeContextType {
  notifications: any[]
  teams: any[]
  leaderboard: any[]
  challenges: any[]
  updateTeam: (teamId: string, data: any) => void
  addNotification: (notification: any) => void
}

const RealtimeContext = createContext<RealtimeContextType>({
  notifications: [],
  teams: [],
  leaderboard: [],
  challenges: [],
  updateTeam: () => {},
  addNotification: () => {},
})

export const useRealtime = () => useContext(RealtimeContext)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState([
    { id: 1, type: "challenge", message: "New challenge available: Plastic-Free Week", time: "2 min ago" },
    { id: 2, type: "team", message: "Sarah Green joined your team", time: "5 min ago" },
  ])

  const [teams, setTeams] = useState([
    { id: "1", name: "EcoWarriors Delhi", members: 24, points: 4580, rank: 1, city: "Delhi" },
    { id: "2", name: "Green Guardians Mumbai", members: 31, points: 4320, rank: 2, city: "Mumbai" },
  ])

  const [leaderboard, setLeaderboard] = useState([])
  const [challenges, setChallenges] = useState([])
  const { supabase } = useApp()

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly update team points
      setTeams((prev) =>
        prev.map((team) => ({
          ...team,
          points: team.points + Math.floor(Math.random() * 10),
        })),
      )
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const updateTeam = (teamId: string, data: any) => {
    setTeams((prev) => prev.map((team) => (team.id === teamId ? { ...team, ...data } : team)))
  }

  const addNotification = (notification: any) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 9)]) // Keep last 10
  }

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        teams,
        leaderboard,
        challenges,
        updateTeam,
        addNotification,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

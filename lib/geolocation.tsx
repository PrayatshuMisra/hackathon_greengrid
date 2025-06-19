"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface GeolocationContextType {
  location: { lat: number; lng: number; city: string } | null
  nearbyEvents: any[]
  localChallenges: any[]
  getLocationBasedContent: (lat: number, lng: number) => void
}

const GeolocationContext = createContext<GeolocationContextType>({
  location: null,
  nearbyEvents: [],
  localChallenges: [],
  getLocationBasedContent: () => {},
})

export const useGeolocation = () => useContext(GeolocationContext)

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<{ lat: number; lng: number; city: string } | null>(null)
  const [nearbyEvents, setNearbyEvents] = useState([])
  const [localChallenges, setLocalChallenges] = useState([])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({
            lat: latitude,
            lng: longitude,
            city: "Delhi", 
          })
          getLocationBasedContent(latitude, longitude)
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            console.warn("User denied the request for Geolocation.");
          } else {
              console.error("Geolocation error:", error?.message || error);
          }

          setLocation({ lat: 28.6139, lng: 77.209, city: "Delhi" });
        }

      )
    }
  }, [])

  const getLocationBasedContent = (lat: number, lng: number) => {
  
    const mockEvents = [
      {
        id: 1,
        title: "Community Tree Plantation",
        date: "2024-12-15",
        location: "Central Park",
        distance: calculateDistance(lat, lng, 28.6304, 77.2177),
      },
    ]

    const mockChallenges = [
      {
        id: 1,
        title: "Delhi Air Quality Challenge",
        type: "air-quality",
        distance: calculateDistance(lat, lng, 28.6139, 77.209),
      },
    ]

    setNearbyEvents(mockEvents)
    setLocalChallenges(mockChallenges)
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  return (
    <GeolocationContext.Provider
      value={{
        location,
        nearbyEvents,
        localChallenges,
        getLocationBasedContent,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  )
}

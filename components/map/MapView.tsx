"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGeolocation } from "@/lib/geolocation"
import { useApp } from "@/app/providers"
import { MapPin, Navigation, Calendar, Users, TreePine, Droplets, Zap, Filter } from "lucide-react"

export function MapView() {
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { location, nearbyEvents, localChallenges } = useGeolocation()
  const { user } = useApp()

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setIsLoading(false)
      return
    }

    const successHandler = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      setUserLocation({ lat: latitude, lng: longitude })
      setMapCenter({ lat: latitude, lng: longitude })
      setIsLoading(false)
      setError(null)
    }

    const errorHandler = () => {
      setError("Unable to retrieve your location")
      setIsLoading(false)
      setMapCenter({ lat: 28.6139, lng: 77.209 })
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler)
  }, [])

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter(userLocation)
    } else if (location) {
      setMapCenter(location)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(1) + " km"
  }

  const enhanceWithDistance = (items: any[]) => {
    if (!mapCenter) return items
    
    return items.map(item => ({
      ...item,
      distance: calculateDistance(
        mapCenter.lat,
        mapCenter.lng,
        item.location.lat,
        item.location.lng
      )
    }))
  }

  const mapData = {
    challenges: enhanceWithDistance([
      {
        id: 1,
        title: "Air Quality Challenge",
        type: "air-quality",
        location: { lat: mapCenter ? mapCenter.lat + 0.01 : 28.6139, lng: mapCenter ? mapCenter.lng + 0.01 : 77.209 },
        participants: 234,
        reward: 200,
      },
      {
        id: 2,
        title: "Water Cleanup Initiative",
        type: "water-cleanup",
        location: { lat: mapCenter ? mapCenter.lat + 0.02 : 28.6562, lng: mapCenter ? mapCenter.lng - 0.01 : 77.241 },
        participants: 156,
        reward: 300,
      },
      {
        id: 3,
        title: "Urban Forest Initiative",
        type: "tree-planting",
        location: { lat: mapCenter ? mapCenter.lat - 0.03 : 28.5355, lng: mapCenter ? mapCenter.lng + 0.02 : 77.391 },
        participants: 89,
        reward: 250,
      },
    ]),
    events: enhanceWithDistance([
      {
        id: 1,
        title: "Community Tree Plantation",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: "09:00 AM",
        location: { lat: mapCenter ? mapCenter.lat + 0.005 : 28.6304, lng: mapCenter ? mapCenter.lng + 0.005 : 77.2177 },
        organizer: "Green Initiative",
        attendees: 45,
      },
      {
        id: 2,
        title: "Solar Energy Workshop",
        date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 days from now
        time: "02:00 PM",
        location: { lat: mapCenter ? mapCenter.lat - 0.015 : 28.5244, lng: mapCenter ? mapCenter.lng - 0.02 : 77.1855 },
        organizer: "Renewable Energy Forum",
        attendees: 67,
      },
    ]),
    teams: enhanceWithDistance([
      {
        id: 1,
        name: "EcoWarriors",
        location: { lat: mapCenter ? mapCenter.lat + 0.002 : 28.6139, lng: mapCenter ? mapCenter.lng + 0.002 : 77.209 },
        members: 24,
        points: 4580,
      },
      {
        id: 2,
        name: "Green Guardians",
        location: { lat: mapCenter ? mapCenter.lat + 0.008 : 28.6328, lng: mapCenter ? mapCenter.lng - 0.005 : 77.2197 },
        members: 18,
        points: 3890,
      },
    ]),
  }

  const getFilteredData = () => {
    switch (selectedFilter) {
      case "challenges":
        return mapData.challenges
      case "events":
        return mapData.events
      case "teams":
        return mapData.teams
      default:
        return [...mapData.challenges, ...mapData.events, ...mapData.teams]
    }
  }

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case "air-quality":
      case "energy":
        return <Zap className="h-4 w-4 text-yellow-600" />
      case "water-cleanup":
        return <Droplets className="h-4 w-4 text-blue-600" />
      case "tree-planting":
        return <TreePine className="h-4 w-4 text-green-600" />
      case "event":
        return <Calendar className="h-4 w-4 text-purple-600" />
      case "team":
        return <Users className="h-4 w-4 text-orange-600" />
      default:
        return <MapPin className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <p>{error}</p>
        <p className="text-sm mt-2">Showing default location (Delhi, India)</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Eco Map</h2>
          <p className="text-green-600">Discover local challenges, events, and teams near you</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="challenges">Challenges</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="teams">Teams</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCenterOnUser}
          >
            <Navigation className="h-4 w-4 mr-2" />
            My Location
          </Button>
        </div>
      </div>

      {/* Location Info */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Your Location</h3>
                <p className="text-sm text-blue-600">{user?.location?.city || "Current Location"}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-600">Coordinates</div>
              <div className="text-xs font-mono text-blue-700">
                {mapCenter?.lat.toFixed(4)}, {mapCenter?.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                {mapCenter ? `Showing activities near your location` : 'Loading map...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simulated Map View */}
              <div className="relative h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden">
                {/* Map Background */}
                <div className="absolute inset-0 opacity-20">
                  <svg viewBox="0 0 400 300" className="w-full h-full">
                    {/* Simulated map roads */}
                    <path d="M0,150 Q100,100 200,150 T400,150" stroke="#666" strokeWidth="2" fill="none" />
                    <path d="M200,0 Q150,100 200,200 T200,300" stroke="#666" strokeWidth="2" fill="none" />
                    <path d="M0,100 L400,100" stroke="#666" strokeWidth="1" fill="none" />
                    <path d="M0,200 L400,200" stroke="#666" strokeWidth="1" fill="none" />
                  </svg>
                </div>

                {/* Map Markers */}
                <div className="absolute inset-0 p-4">
                  {getFilteredData()
                    .slice(0, 6)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                        style={{
                          left: `${20 + (index % 3) * 30}%`,
                          top: `${20 + Math.floor(index / 3) * 40}%`,
                        }}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-green-500 group-hover:scale-110 transition-transform">
                            {getMarkerIcon(item.type || "default")}
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              {item.title}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {/* User Location Marker */}
                  {mapCenter && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg pulse-green"></div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-xs font-medium text-blue-700">
                        You
                      </div>
                    </div>
                  )}
                </div>

                {/* Map Controls */}
                <div className="absolute top-4 right-4 space-y-2">
                  <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                    +
                  </Button>
                  <Button size="sm" variant="outline" className="w-8 h-8 p-0">
                    -
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Nearby Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nearby Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mapData.challenges.slice(0, 3).map((challenge) => (
                <div key={challenge.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-green-800 text-sm">{challenge.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {challenge.reward} pts
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-green-600">
                    <span>{challenge.participants} joined</span>
                    <span>{challenge.distance}</span>
                  </div>
                  <Button size="sm" className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs">
                    Join Challenge
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mapData.events.map((event) => (
                <div key={event.id} className="p-3 border border-purple-200 rounded-lg bg-purple-50">
                  <h4 className="font-medium text-purple-800 text-sm mb-1">{event.title}</h4>
                  <p className="text-xs text-purple-600 mb-2">by {event.organizer}</p>
                  <div className="flex items-center justify-between text-xs text-purple-600 mb-2">
                    <span>
                      {event.date} • {event.time}
                    </span>
                    <span>{event.distance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-600">{event.attendees} attending</span>
                    <Button size="sm" variant="outline" className="text-xs">
                      RSVP
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Nearby Teams */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nearby Teams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mapData.teams.map((team) => (
                <div key={team.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                  <h4 className="font-medium text-orange-800 text-sm mb-1">{team.name}</h4>
                  <div className="flex items-center justify-between text-xs text-orange-600 mb-2">
                    <span>{team.members} members</span>
                    <span>{team.distance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-700">{team.points} points</span>
                    <Button size="sm" variant="outline" className="text-xs">
                      View Team
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
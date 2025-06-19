"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Navigation,
  Filter,
  ZoomIn,
  ZoomOut,
  Share2,
} from "lucide-react";
import {
  FaWhatsapp,
  FaLinkedin,
  FaXTwitter,
} from "react-icons/fa6";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icons
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Component to recenter the map on location change
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center]);
  return null;
}

export function MapView() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    28.6139, 77.209,
  ]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [zoomLevel, setZoomLevel] = useState(13);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [
            pos.coords.latitude,
            pos.coords.longitude,
          ];
          setUserLocation(coords);
          setMapCenter(coords);
        },
        () => {
          setError("Location access denied. Showing default location.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  const mapData = {
    challenges: [
      {
        id: 1,
        title: "Plastic-Free Street",
        lat: mapCenter[0] + 0.01,
        lng: mapCenter[1] + 0.01,
        type: "challenge",
        reward: 25,
        participants: 14,
        distance: "1.2 km",
      },
    ],
    events: [
      {
        id: 2,
        title: "Tree Plantation Drive",
        lat: mapCenter[0] - 0.01,
        lng: mapCenter[1] + 0.005,
        type: "event",
        date: "June 25",
        time: "10:00 AM",
        organizer: "Green Delhi",
        attendees: 56,
        distance: "2.4 km",
      },
    ],
    teams: [
      {
        id: 3,
        name: "EcoWarriors Delhi",
        lat: mapCenter[0] + 0.005,
        lng: mapCenter[1] - 0.008,
        type: "team",
        members: 10,
        points: 340,
        distance: "0.9 km",
      },
    ],
  };

  const getFilteredData = () => {
    switch (selectedFilter) {
      case "challenges":
        return mapData.challenges;
      case "events":
        return mapData.events;
      case "teams":
        return mapData.teams;
      default:
        return [
          ...mapData.challenges,
          ...mapData.events,
          ...mapData.teams,
        ];
    }
  };

  function getIcon(type: string) {
    return new L.Icon({
      iconUrl:
        type === "challenge"
          ? "https://img.icons8.com/emoji/48/000000/leaf-emoji.png"
          : type === "event"
          ? "https://img.icons8.com/emoji/48/000000/calendar-emoji.png"
          : "https://img.icons8.com/emoji/48/000000/group-of-people.png",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });
  }

  const shareUrl = () =>
    `${window.location.origin}/map?lat=${mapCenter[0]}&lng=${mapCenter[1]}`;

  const shareGeneric = (url: string) => window.open(url, "_blank");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Eco Map</h2>
          <p className="text-green-600">
            Explore local challenges, events, and teams
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedFilter}
            onValueChange={setSelectedFilter}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="challenges">Challenges</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="teams">Teams</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => userLocation && setMapCenter(userLocation)}
          >
            <Navigation className="mr-2 h-4 w-4" />
            My Location
          </Button>

          <Button
            variant="outline"
            onClick={() => shareGeneric(`https://wa.me/?text=${encodeURIComponent(shareUrl())}`)}
          >
            <FaWhatsapp className="mr-1 h-4 w-4 text-green-600" />
            WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              shareGeneric(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  shareUrl()
                )}`
              )
            }
          >
            <FaXTwitter className="mr-1 h-4 w-4" />
            X
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              shareGeneric(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareUrl()
                )}`
              )
            }
          >
            <FaLinkedin className="mr-1 h-4 w-4 text-blue-600" />
            LinkedIn
          </Button>
        </div>
      </div>

      {/* Location Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Location</CardTitle>
          <CardDescription className="text-xs">
            Coordinates and center controls
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div className="font-mono">
            {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              onClick={() => setZoomLevel((z) => Math.min(z + 1, 18))}
            >
              <ZoomIn />
            </Button>
            <Button
              size="icon"
              onClick={() => setZoomLevel((z) => Math.max(z - 1, 1))}
            >
              <ZoomOut />
            </Button>
            <Button size="icon" onClick={() => shareGeneric(shareUrl())}>
              <Share2 />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map View */}
        <Card className="lg:col-span-2 relative z-10">
          <CardHeader>
            <CardTitle>Interactive Map</CardTitle>
          </CardHeader>
          <CardContent>
            <MapContainer
              center={mapCenter}
              zoom={zoomLevel}
              scrollWheelZoom
              style={{ height: "500px", width: "100%" }}
            >
              <RecenterMap center={mapCenter} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {getFilteredData().map((item) => (
                <Marker
                  key={item.id}
                  position={[item.lat, item.lng]}
                  icon={getIcon(item.type)}
                >
                  <Popup>
                    <strong>{item.title || item.name}</strong>
                    <br />
                    Type: {item.type}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </CardContent>
        </Card>

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

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRealtime } from "@/lib/realtime"

export function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState("teams")
  const [leaderboardScope, setLeaderboardScope] = useState("global")
  const { teams } = useRealtime()

  const teamsData = [
    { id: 1, name: "EcoWarriors Delhi", members: 24, points: 4580, rank: 1, city: "Delhi" },
    { id: 2, name: "Green Guardians Mumbai", members: 31, points: 4320, rank: 2, city: "Mumbai" },
    { id: 3, name: "Bangalore Bikers", members: 18, points: 3890, rank: 3, city: "Bangalore" },
    { id: 4, name: "Chennai Champions", members: 22, points: 3650, rank: 4, city: "Chennai" },
    { id: 5, name: "Pune Planet Savers", members: 27, points: 3420, rank: 5, city: "Pune" },
    { id: 6, name: "Hyderabad Eco Heroes", members: 19, points: 3210, rank: 6, city: "Hyderabad" },
    { id: 7, name: "Kolkata Green Team", members: 21, points: 3050, rank: 7, city: "Kolkata" },
    { id: 8, name: "Jaipur Sustainability Squad", members: 16, points: 2890, rank: 8, city: "Jaipur" },
  ]

  const individualsData = [
    { id: 1, name: "Rahul Sharma", points: 1250, rank: 1, city: "Delhi", team: "EcoWarriors Delhi" },
    { id: 2, name: "Priya Patel", points: 1180, rank: 2, city: "Mumbai", team: "Green Guardians Mumbai" },
    { id: 3, name: "Amit Kumar", points: 1090, rank: 3, city: "Bangalore", team: "Bangalore Bikers" },
    { id: 4, name: "Deepa Nair", points: 980, rank: 4, city: "Chennai", team: "Chennai Champions" },
    { id: 5, name: "Vikram Singh", points: 920, rank: 5, city: "Delhi", team: "EcoWarriors Delhi" },
    { id: 6, name: "Ananya Reddy", points: 870, rank: 6, city: "Hyderabad", team: "Hyderabad Eco Heroes" },
    { id: 7, name: "Rajesh Gupta", points: 830, rank: 7, city: "Pune", team: "Pune Planet Savers" },
    { id: 8, name: "Meera Joshi", points: 790, rank: 8, city: "Mumbai", team: "Green Guardians Mumbai" },
  ]

  const leaderboardData = leaderboardType === "teams" ? teamsData : individualsData

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Leaderboard</h2>
          <p className="text-green-600">See how teams and individuals are making a difference</p>
        </div>
        <div className="flex space-x-2">
          <Select value={leaderboardType} onValueChange={setLeaderboardType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teams">Teams</SelectItem>
              <SelectItem value="individuals">Individuals</SelectItem>
            </SelectContent>
          </Select>
          <Select value={leaderboardScope} onValueChange={setLeaderboardScope}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="city">City</SelectItem>
              <SelectItem value="college">College</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {leaderboardData.slice(0, 3).map((item, index) => (
          <Card
            key={item.id}
            className={`text-center ${
              index === 0
                ? "border-yellow-300 bg-gradient-to-b from-yellow-50 to-yellow-100"
                : index === 1
                  ? "border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100"
                  : "border-orange-300 bg-gradient-to-b from-orange-50 to-orange-100"
            }`}
          >
            <CardContent className="pt-6">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold ${
                  index === 0
                    ? "bg-yellow-200 text-yellow-800"
                    : index === 1
                      ? "bg-gray-200 text-gray-800"
                      : "bg-orange-200 text-orange-800"
                }`}
              >
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
              <h3 className="font-bold text-lg">{item.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.city}</p>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-600">{item.points.toLocaleString()}</div>
                <div className="text-sm text-gray-500">EcoPoints</div>
                {leaderboardType === "teams" && <div className="text-sm text-gray-500">{item.members} members</div>}
                {leaderboardType === "individuals" && <div className="text-sm text-gray-500">Team: {item.team}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>{leaderboardType === "teams" ? "Team Rankings" : "Individual Rankings"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboardData.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      item.rank <= 3 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.rank}
                  </div>
                  <div>
                    <h4 className="font-semibold">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.city} • {leaderboardType === "teams" ? `${item.members} members` : item.team}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{item.points.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">EcoPoints</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Your Ranking */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            {leaderboardType === "teams" ? "Your Team: EcoWarriors Delhi" : "Your Ranking"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{leaderboardType === "teams" ? "1st" : "156th"}</div>
              <div className="text-sm text-green-600">Current Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{leaderboardType === "teams" ? "4,580" : "2,340"}</div>
              <div className="text-sm text-green-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {leaderboardType === "teams" ? "24" : "EcoWarriors Delhi"}
              </div>
              <div className="text-sm text-green-600">{leaderboardType === "teams" ? "Team Members" : "Team"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">{leaderboardType === "teams" ? "18" : "12"}</div>
              <div className="text-sm text-green-600">
                {leaderboardType === "teams" ? "Active Challenges" : "Challenges Completed"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

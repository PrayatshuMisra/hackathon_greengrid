"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { useApp } from "@/app/providers"
import { useRealtime } from "@/lib/realtime"
import { Zap, Droplets, Recycle, TreePine, Target, Award, TrendingUp, CheckCircle, Clock, Users } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AIVerification } from "@/components/ai/AIVerification"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function Dashboard() {
  const { user, supabase } = useApp()
  const { teams, notifications } = useRealtime()
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    rank: 0,
    challengesCompleted: 0,
    co2Saved: 0,
    waterSaved: 0,
    plasticAvoided: 0,
    treesPlanted: 0,
    weeklyProgress: 0,
    level: 1,
    levelTitle: "Eco Beginner",
  })
  const [loading, setLoading] = useState(true)
  const [submitProofOpen, setSubmitProofOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [activeChallenges, setActiveChallenges] = useState([
    {
      id: 1,
      title: "Plastic-Free Week Challenge",
      description: "Avoid single-use plastics for 7 consecutive days",
      progress: 60,
      daysLeft: 3,
      points: 150,
      participants: 1247,
      type: "plastic-free",
    },
    {
      id: 2,
      title: "Bike to Work/School",
      description: "Use bicycle for daily commute for 5 days",
      progress: 80,
      daysLeft: 1,
      points: 200,
      participants: 892,
      type: "bike-commute",
    },
  ])

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase.from("user_dashboard_stats").select("*").eq("user_id", user.id).single()

        if (error && error.code !== "PGRST116") {
          throw error
        }

        if (data) {
          setUserStats({
            totalPoints: data.total_points || 0,
            rank: data.rank || 0,
            challengesCompleted: data.challenges_completed || 0,
            co2Saved: data.co2_saved || 0,
            waterSaved: data.water_saved || 0,
            plasticAvoided: data.plastic_avoided || 0,
            treesPlanted: data.trees_planted || 0,
            weeklyProgress: 75, 
            level: data.level || 1,
            levelTitle: getLevelTitle(data.level || 1),
          })
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_points, level, rank")
            .eq("id", user.id)
            .single()

          if (profile) {
            setUserStats({
              ...userStats,
              totalPoints: profile.total_points || 0,
              level: profile.level || 1,
              rank: profile.rank || 0,
              levelTitle: getLevelTitle(profile.level || 1),
            })
          }
        }
      } catch (error) {
        console.error("Error fetching user stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [user?.id, supabase])

  const getLevelTitle = (level: number) => {
    const titles = [
      "Eco Beginner",
      "Green Novice",
      "Sustainability Enthusiast",
      "Eco Warrior",
      "Climate Champion",
      "Environmental Hero",
      "Planet Protector",
      "Earth Guardian",
      "Eco Legend",
      "Climate Savior",
    ]
    return titles[Math.min(level - 1, titles.length - 1)]
  }

  const badges = [
    { name: "Plastic-Free Warrior", icon: "🛡️", earned: true, rarity: "Epic" },
    { name: "Energy Saver", icon: "⚡", earned: true, rarity: "Rare" },
    { name: "Water Guardian", icon: "💧", earned: false, rarity: "Legendary" },
    { name: "Green Commuter", icon: "🚲", earned: true, rarity: "Common" },
    { name: "Compost Champion", icon: "🌱", earned: false, rarity: "Rare" },
    { name: "Tree Planter", icon: "🌳", earned: true, rarity: "Epic" },
  ]

  const recentActivity = [
    { action: "Completed Plastic-Free Day 4", points: 25, time: "2 hours ago", type: "challenge" },
    { action: "Joined Bike Commute Challenge", points: 0, time: "1 day ago", type: "join" },
    { action: "Earned Energy Saver Badge", points: 100, time: "3 days ago", type: "badge" },
    { action: "Planted tree in community drive", points: 50, time: "1 week ago", type: "event" },
  ]

  const handleSubmitProof = (challenge: any) => {
    setSelectedChallenge(challenge)
    setSubmitProofOpen(true)
  }

  const handleVerificationComplete = async (result: any) => {
    if (result.success) {
      try {
        const updatedChallenges = activeChallenges.map((challenge) =>
          challenge.id === selectedChallenge.id
            ? { ...challenge, progress: Math.min(100, challenge.progress + 20) }
            : challenge,
        )

        setActiveChallenges(updatedChallenges)

        if (updatedChallenges.find((c) => c.id === selectedChallenge.id)?.progress === 100) {
          setUserStats((prev) => ({
            ...prev,
            totalPoints: prev.totalPoints + selectedChallenge.points,
            challengesCompleted: prev.challengesCompleted + 1,
          }))

          toast({
            title: "Challenge Completed!",
            description: `Congratulations! You've earned ${selectedChallenge.points} EcoPoints!`,
            variant: "success",
          })
        } else {
          toast({
            title: "Verification Successful!",
            description: "Your challenge proof has been verified and your progress has been updated.",
            variant: "success",
          })
        }

        setSubmitProofOpen(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to process verification",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Verification Failed",
        description: result.message || "Your submission could not be verified. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-green-800">
                Welcome back, {user?.name?.split(" ")[0] || "User"}! 🌱
              </h2>
              <p className="text-green-600">You're making a real difference for our planet</p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
                  Level {userStats.level} - {userStats.levelTitle}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <Users className="h-4 w-4" />
                  <span>Rank #{userStats.rank || "N/A"} globally</span>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-4xl font-bold text-green-700">{userStats.totalPoints}</div>
              <div className="text-sm text-green-600">EcoPoints</div>
              <div className="w-32">
                <Progress value={userStats.weeklyProgress} className="h-2" />
                <div className="text-xs text-green-500 mt-1">Weekly Goal: {userStats.weeklyProgress}%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-200 rounded-full">
                <Zap className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">CO₂ Saved</p>
                <p className="text-2xl font-bold text-green-800">{userStats.co2Saved}kg</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-200 rounded-full">
                <Droplets className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Water Saved</p>
                <p className="text-2xl font-bold text-blue-800">{userStats.waterSaved}L</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">+8% this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-200 rounded-full">
                <Recycle className="h-6 w-6 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Plastic Avoided</p>
                <p className="text-2xl font-bold text-orange-800">{userStats.plasticAvoided}kg</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500">+15% this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-200 rounded-full">
                <TreePine className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 font-medium">Trees Planted</p>
                <p className="text-2xl font-bold text-emerald-800">{userStats.treesPlanted}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+1 this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Challenges */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Your Active Challenges</span>
              </CardTitle>
              <CardDescription>Keep up the momentum! Complete these challenges to earn more EcoPoints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge) => (
                  <Card key={challenge.id} className="border-green-200 bg-green-50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-800 mb-1">{challenge.title}</h4>
                          <p className="text-sm text-green-600 mb-2">{challenge.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-700">Progress</span>
                              <span className="font-medium text-green-800">{challenge.progress}%</span>
                            </div>
                            <Progress value={challenge.progress} className="h-2" />
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-200 text-green-800 ml-4">
                          {challenge.points} pts
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-green-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{challenge.daysLeft} days left</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{challenge.participants} joined</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleSubmitProof(challenge)}
                        >
                          Submit Proof
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">No active challenges yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Join challenges to start making an impact!</p>
                  <Button onClick={() => router.push("/challenges")} className="bg-green-600 hover:bg-green-700">
                    Browse Challenges
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "challenge"
                          ? "bg-green-100"
                          : activity.type === "badge"
                            ? "bg-yellow-100"
                            : activity.type === "event"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                      }`}
                    >
                      {activity.type === "challenge" && <Target className="h-4 w-4 text-green-600" />}
                      {activity.type === "badge" && <Award className="h-4 w-4 text-yellow-600" />}
                      {activity.type === "event" && <TreePine className="h-4 w-4 text-blue-600" />}
                      {activity.type === "join" && <Users className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.points > 0 && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        +{activity.points} pts
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Badges Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Your Badges</span>
              </CardTitle>
              <CardDescription>Collect badges by completing challenges and eco-actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`relative text-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      badge.earned
                        ? "border-yellow-300 bg-yellow-50 shadow-md hover:shadow-lg"
                        : "border-gray-200 bg-gray-50 opacity-50 hover:opacity-75"
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">{badge.name}</div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        badge.rarity === "Legendary"
                          ? "border-purple-300 text-purple-600"
                          : badge.rarity === "Epic"
                            ? "border-orange-300 text-orange-600"
                            : badge.rarity === "Rare"
                              ? "border-blue-300 text-blue-600"
                              : "border-gray-300 text-gray-600"
                      }`}
                    >
                      {badge.rarity}
                    </Badge>
                    {badge.earned && (
                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-600 bg-white rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Team Name</span>
                  <span className="font-medium">EcoWarriors Delhi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rank</span>
                  <Badge className="bg-yellow-100 text-yellow-800">#1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Members</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Points</span>
                  <span className="font-bold text-green-600">4,580</span>
                </div>
                <Button variant="outline" className="w-full mt-3" onClick={() => router.push("/teams")}>
                  View Team Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickActions />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Proof Dialog */}
      <Dialog open={submitProofOpen} onOpenChange={setSubmitProofOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit Challenge Proof</DialogTitle>
            <DialogDescription>Upload proof of your eco-action for verification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedChallenge && (
              <AIVerification
                challengeType={selectedChallenge.type}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

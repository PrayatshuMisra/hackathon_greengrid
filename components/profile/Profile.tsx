"use client"

import type React from "react"
import HelpCenterModal from '@/components/map/HelpCenterModal';
import MailModal from '@/components/ui/MailModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/app/providers"
import { Camera, Award, CheckCircle, Shield, Bell, Lock, HelpCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function Profile() {
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [activeTab, setActiveTab] = useState("profile")
  const { user } = useApp()
  const [loading, setLoading] = useState(false)
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "Salman Khan",
    email: user?.email || "salman@email.com",
    location: user?.location?.city?.toLowerCase() || "delhi",
    team: "ecowarriors",
    bio: "Passionate about sustainable living and climate action. Love cycling and growing my own vegetables!",
    avatar: user?.avatar_url || "/placeholder.svg",
  })

  const supabase = createClientComponentClient();
const [userEmail, setUserEmail] = useState('');

useEffect(() => {
  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      setUserEmail(user.email);
    }
  };

  fetchUser();
}, []);


  const userStats = {
    totalPoints: 2340,
    rank: 156,
    challengesCompleted: 12,
    co2Saved: 45.6,
    waterSaved: 234,
    plasticAvoided: 12.3,
    treesPlanted: 3,
    level: 5,
    nextLevelProgress: 65,
  }

  const badges = [
    { name: "Plastic-Free Warrior", icon: "🛡️", earned: true, rarity: "Epic" },
    { name: "Energy Saver", icon: "⚡", earned: true, rarity: "Rare" },
    { name: "Water Guardian", icon: "💧", earned: false, rarity: "Legendary" },
    { name: "Green Commuter", icon: "🚲", earned: true, rarity: "Common" },
    { name: "Compost Champion", icon: "🌱", earned: false, rarity: "Rare" },
    { name: "Tree Planter", icon: "🌳", earned: true, rarity: "Epic" },
  ]

  const completedChallenges = [
    {
      title: "Plastic-Free Week",
      date: "Nov 15, 2024",
      points: 150,
      impact: "5kg plastic saved",
      badge: "Plastic-Free Warrior",
    },
    {
      title: "Bike to Work Challenge",
      date: "Oct 28, 2024",
      points: 200,
      impact: "12kg CO₂ reduced",
      badge: "Green Commuter",
    },
    {
      title: "Tree Planting Event",
      date: "Oct 10, 2024",
      points: 100,
      impact: "3 trees planted",
      badge: "Tree Planter",
    },
    {
      title: "Energy Saving Month",
      date: "Sep 30, 2024",
      points: 300,
      impact: "25kWh saved",
      badge: "Energy Saver",
    },
  ]

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {

      const imageUrl = URL.createObjectURL(file)

      setProfileData((prev) => ({
        ...prev,
        avatar: imageUrl,
      }))

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      })
    }
  }

  const handleSaveChanges = async () => {
    setLoading(true)

    try {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "success",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileData.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xl">{profileData.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-green-600 hover:bg-green-700"
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user?.name || "Salman Khan"}</h3>
                  <p className="text-gray-600">Eco Warrior since March 2024</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="bg-green-100 text-green-800">Level {userStats.level} - Climate Champion</Badge>
                    <div className="text-xs text-gray-500">
                      {userStats.nextLevelProgress}% to Level {userStats.level + 1}
                    </div>
                  </div>
                  <Progress value={userStats.nextLevelProgress} className="h-1 w-32 mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <Input
                      defaultValue={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      defaultValue={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <Select
                      defaultValue={profileData.location}
                      onValueChange={(value) => setProfileData((prev) => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team</label>
                    <Select defaultValue="ecowarriors">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecowarriors">EcoWarriors Delhi</SelectItem>
                        <SelectItem value="greenguardians">Green Guardians Mumbai</SelectItem>
                        <SelectItem value="bangalorebikers">Bangalore Bikers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <Textarea
                      placeholder="Tell us about your eco journey..."
                      defaultValue={profileData.bio}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveChanges} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>

          {/* Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Your Impact Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{userStats.challengesCompleted}</div>
                  <div className="text-sm text-green-600">Challenges Completed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{userStats.totalPoints}</div>
                  <div className="text-sm text-blue-600">Total EcoPoints</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{userStats.rank}</div>
                  <div className="text-sm text-yellow-600">Global Rank</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{badges.filter((b) => b.earned).length}</div>
                  <div className="text-sm text-purple-600">Badges Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Badge Collection</span>
              </CardTitle>
              <CardDescription>Collect badges by completing challenges and eco-actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`relative text-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      badge.earned
                        ? "border-yellow-300 bg-yellow-50 shadow-md hover:shadow-lg"
                        : "border-gray-200 bg-gray-50 opacity-50 hover:opacity-75"
                    }`}
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
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
                      <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-600 bg-white rounded-full" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Challenge History</CardTitle>
              <CardDescription>Your completed eco-challenges and their impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedChallenges.map((challenge, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">Impact: {challenge.impact}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            +{challenge.points} pts
                          </Badge>
                          <Badge variant="outline" className="text-purple-600 border-purple-300">
                            {challenge.badge}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">{challenge.date}</div>
                        <CheckCircle className="h-5 w-5 text-green-600 ml-auto mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Challenge reminders</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Team updates</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span>New events</span>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Weekly reports</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Public profile</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Show in leaderboard</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Share achievements</span>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Location sharing</span>
                  <input type="checkbox" className="rounded" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Two-Factor Authentication
                </Button>
                <Button variant="outline" className="w-full">
                  Download Data
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  <span>Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <Button variant="outline" className="w-full">
                  Help Center
                </Button> */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsHelpCenterOpen(true)}
                >
                Help Center
                </Button>

                <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                setEmailSubject('Bug Report');
                setMailModalOpen(true);
              }}
              >
              Report a Bug
              </Button>

              <Button
              variant="outline"
              className="w-full"
              onClick={() => {
              setEmailSubject('Feature Request');
              setMailModalOpen(true);
              }}
              >
              Feature Request
              </Button>

            <Button
            variant="outline"
            className="w-full"
            onClick={() => {
            setEmailSubject('Contact Support');
            setMailModalOpen(true);
            }}
            >
            Contact Support
            </Button>
              </CardContent>
            </Card>
            <HelpCenterModal
            isOpen={isHelpCenterOpen}
            onRequestClose={() => setIsHelpCenterOpen(false)}
            />
            <MailModal
            isOpen={mailModalOpen}
            onRequestClose={() => setMailModalOpen(false)}
            recipient="greengrid.care@gmail.com"
            subject={emailSubject}
            sender={userEmail}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

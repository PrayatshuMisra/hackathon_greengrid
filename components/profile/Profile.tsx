"use client"
import HelpCenterModal from '@/components/map/HelpCenterModal';
import MailModal from '@/components/ui/MailModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Camera, Award, CheckCircle, Shield, Bell, Lock, HelpCircle, Share2 } from "lucide-react"
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram } from "react-icons/fa6"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useApp } from "@/app/providers"
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const supabaseUrl = "https://lenuuxzhvadftlfbozox.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbnV1eHpodmFkZnRsZmJvem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NzMzNjIsImV4cCI6MjA2NTU0OTM2Mn0.YOVr0cGaVyp7APpi4QkimMFjT6DZmyBlNuZMed3STN8"

export function Profile() {
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [activeTab, setActiveTab] = useState("profile")
  const { user } = useApp()
  const [loading, setLoading] = useState(false)
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false)

  const [profileData, setProfileData] = useState({
    name: user?.name || "Salman Khan",
    email: user?.email || "salman@email.com",
    location: user?.location?.city?.toLowerCase() || "delhi",
    team: "ecowarriors",
    bio: "Passionate about sustainable living and climate action. Love cycling and growing my own vegetables!",
    avatar: user?.avatar_url || "/placeholder.svg",
  })

  const supabase = createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnonKey
  });
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
    level: 1,
    nextLevelProgress: 73,
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

  const impactSummaryRef = useRef<HTMLDivElement>(null)
  const badgeCollectionRef = useRef<HTMLDivElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setProfileData(prev => ({
        ...prev,
        avatar: publicUrl
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
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          bio: profileData.bio,
          location: profileData.location
        })
        .eq('id', user?.id)

      if (error) throw error

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

  const handleDownloadData = async () => {
    setDownloadingData(true)
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      const { data: challenges, error: challengesError } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user?.id)

      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user?.id)

      if (profileError || challengesError || badgesError) {
        throw new Error(profileError?.message || challengesError?.message || badgesError?.message)
      }

      const userData = {
        profile,
        stats: userStats,
        challenges,
        badges,
        settings: {
        },
        downloadedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `greengrid-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Downloaded",
        description: "Your user data has been downloaded successfully.",
        variant: "success",
      })
    } catch (error: any) {
      console.error('Data download error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to download user data",
        variant: "destructive",
      })
    } finally {
      setDownloadingData(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    try {
      const { data: user, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (authError) {
        throw authError;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setPasswordModalOpen(false);
      }, 2000);
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordError(error.message || "Failed to update password");
    }
  };

  const shareToInstagramStory = async (imageUrl: string) => {
    try {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = 'greengrid-impact.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Ready for Instagram!",
        description: "Image saved - open Instagram to share to your story",
        variant: "default",
        action: (
          <Button 
            variant="outline" 
            onClick={() => window.open('instagram://story', '_blank')}
          >
            Open Instagram
          </Button>
        ),
        duration: 10000
      })
    } catch (error) {
      console.error('Error sharing to Instagram:', error)
      toast({
        title: "Error",
        description: "Could not prepare image for Instagram",
        variant: "destructive",
      })
    }
  }

  const generateShareImage = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) {
      toast({
        title: "Error",
        description: "Could not generate shareable image",
        variant: "destructive",
      })
      return null
    }

    try {
      return await toPng(ref.current, {
        backgroundColor: '#ffffff',
        quality: 1,
        pixelRatio: 2,
        style: {
          borderRadius: '12px',
          padding: '20px'
        }
      })
    } catch (error) {
      console.error('Error generating image:', error)
      toast({
        title: "Error",
        description: "Failed to create shareable image",
        variant: "destructive",
      })
      return null
    }
  }

  const handleShare = async (type: 'impact' | 'badges', platform: string) => {
    const ref = type === 'impact' ? impactSummaryRef : badgeCollectionRef
    const shareText = type === 'impact' 
      ? `Check out my eco impact! 🌱\n${userStats.challengesCompleted} challenges\n${userStats.totalPoints} points\nRank #${userStats.rank}\n${badges.filter(b => b.earned).length} badges\n#GreenGrid`
      : `My eco badges! 🏆\n${badges.filter(b => b.earned).map(b => `${b.name} (${b.rarity})`).join('\n')}\n#GreenGrid`

    if (platform === 'instagram') {
      const imageUrl = await generateShareImage(ref)
      if (imageUrl) {
        await shareToInstagramStory(imageUrl)
      }
      return
    }

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
      return
    }

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareText)}`, '_blank')
      return
    }

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')
      return
    }

    navigator.clipboard.writeText(shareText)
    toast({
      title: "Copied to clipboard",
      description: "Share content is ready to paste",
      variant: "default",
    })
  }

  return (
    <div className="space-y-6">
      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and set a new one.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            {passwordError && (
              <div className="text-red-600 text-sm">{passwordError}</div>
            )}
            
            {passwordSuccess && (
              <div className="text-green-600 text-sm">{passwordSuccess}</div>
            )}
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Change Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab Content */}
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
                  <h3 className="text-xl font-semibold">{profileData.name}</h3>
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
                      value={profileData.name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      value={profileData.email}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <Select
                      value={profileData.location}
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
                    <Select value="ecowarriors">
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
                      value={profileData.bio}
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

          <Card ref={impactSummaryRef}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Impact Summary</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShare('impact', 'whatsapp')}>
                      <FaWhatsapp className="mr-2 text-green-500" /> WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('impact', 'facebook')}>
                      <FaFacebook className="mr-2 text-blue-600" /> Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('impact', 'x')}>
                      <FaXTwitter className="mr-2 text-black-400" /> X
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('impact', 'instagram')}>
                      <FaInstagram className="mr-2 text-pink-600" /> Instagram Story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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

        {/* Achievements Tab Content */}
        <TabsContent value="achievements" className="space-y-6">
          <Card ref={badgeCollectionRef}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <span>Badge Collection</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleShare('badges', 'whatsapp')}>
                      <FaWhatsapp className="mr-2 text-green-500" /> WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('badges', 'facebook')}>
                      <FaFacebook className="mr-2 text-blue-600" /> Facebook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('badges', 'x')}>
                      <FaXTwitter className="mr-2 text-blue-400" /> X
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleShare('badges', 'instagram')}>
                      <FaInstagram className="mr-2 text-pink-600" /> Instagram Story
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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

        {/* History Tab Content */}
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

        {/* Settings Tab Content */}
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
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Two-Factor Authentication
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadData}
                  disabled={downloadingData}
                >
                  {downloadingData ? "Preparing Data..." : "Download Data"}
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
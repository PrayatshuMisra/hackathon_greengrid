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

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  country?: string;
  total_points: number;
  level: number;
  rank?: number;
  team_id?: string;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  total_points: number;
  level: number;
  rank?: number;
  challenges_completed: number;
  badges_earned: number;
  events_attended: number;
  co2_saved: number;
  water_saved: number;
  plastic_avoided: number;
  trees_planted: number;
}

interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  earned: boolean;
  earned_at?: string;
}

interface CompletedChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed_at: string;
  impact_description?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  city: string;
  total_points: number;
  rank?: number;
  member_count: number;
}

interface UserBadge {
  earned_at: string;
  badges: {
    id: string;
    name: string;
    description?: string;
    icon: string;
    rarity: string;
  };
}

interface UserChallenge {
  completed_at: string;
  points_earned: number;
  challenges: {
    id: string;
    title: string;
    description: string;
    points: number;
  };
}

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
  const [userEmail, setUserEmail] = useState('');

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<CompletedChallenge[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabaseClient = createClientComponentClient();
  const impactSummaryRef = useRef<HTMLDivElement>(null)
  const badgeCollectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
      fetchUserEmail();
    }
  }, [user?.id]);

  const fetchUserEmail = async () => {
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();
    if (authUser?.email) {
      setUserEmail(authUser.email);
    }
  };

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setProfileData(profile);

      const { data: stats, error: statsError } = await supabaseClient
        .from('user_dashboard_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsError) throw statsError;
      setUserStats(stats);

      const { data: userBadges, error: badgesError } = await supabaseClient
        .from('user_badges')
        .select(`
          earned_at,
          badges (
            id,
            name,
            description,
            icon,
            rarity
          )
        `)
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;

      const { data: allBadges, error: allBadgesError } = await supabaseClient
        .from('badges')
        .select('*');

      if (allBadgesError) throw allBadgesError;

      const combinedBadges = allBadges.map(badge => ({
        ...badge,
        earned: userBadges.some((ub: any) => ub.badges?.id === badge.id),
        earned_at: userBadges.find((ub: any) => ub.badges?.id === badge.id)?.earned_at
      }));

      setBadges(combinedBadges);

      const { data: challenges, error: challengesError } = await supabaseClient
        .from('user_challenges')
        .select(`
          completed_at,
          points_earned,
          challenges (
            id,
            title,
            description,
            points
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (challengesError) throw challengesError;

      const formattedChallenges = challenges.map((challenge: any) => ({
        id: challenge.challenges.id,
        title: challenge.challenges.title,
        description: challenge.challenges.description,
        points: challenge.points_earned,
        completed_at: challenge.completed_at,
        impact_description: `Earned ${challenge.points_earned} points`
      }));

      setCompletedChallenges(formattedChallenges);

      if (profile.team_id) {
        const { data: team, error: teamError } = await supabaseClient
          .from('teams')
          .select('*')
          .eq('id', profile.team_id)
          .single();

        if (!teamError) {
          setUserTeam(team);
        }
      }

      const { data: teams, error: teamsError } = await supabaseClient
        .from('teams')
        .select('*')
        .order('total_points', { ascending: false });

      if (!teamsError) {
        setAvailableTeams(teams);
      }

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseClient.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfileData(prev => prev ? { ...prev, avatar_url: publicUrl } : null)

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
        variant: "default",
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
    if (!user?.id || !profileData) return;
    
    setLoading(true)
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          name: profileData.name,
          bio: profileData.bio,
          city: profileData.city
        })
        .eq('id', user.id)

      if (error) throw error

      if (profileData.team_id && profileData.team_id !== userTeam?.id) {
        if (userTeam?.id) {
          await supabaseClient
            .from('team_members')
            .delete()
            .eq('team_id', userTeam.id)
            .eq('user_id', user.id);
        }

        await supabaseClient
          .from('team_members')
          .insert({
            team_id: profileData.team_id,
            user_id: user.id,
            role: 'member'
          });
      }

      await fetchUserData();

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
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
    if (!user?.id) return;
    
    setDownloadingData(true)
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: challenges, error: challengesError } = await supabaseClient
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id)

      const { data: userBadges, error: badgesError } = await supabaseClient
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)

      if (profileError || challengesError || badgesError) {
        throw new Error(profileError?.message || challengesError?.message || badgesError?.message)
      }

      const userData = {
        profile,
        stats: userStats,
        challenges,
        badges: userBadges,
        downloadedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `greengrid-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Downloaded",
        description: "Your user data has been downloaded successfully.",
        variant: "default",
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
      const { data: authUser, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });

      if (authError) {
        throw authError;
      }

      const { error: updateError } = await supabaseClient.auth.updateUser({
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
    if (!userStats) return;
    
    const ref = type === 'impact' ? impactSummaryRef : badgeCollectionRef
    const shareText = type === 'impact' 
      ? `Check out my eco impact! 🌱\n${userStats.challenges_completed} challenges\n${userStats.total_points} points\nRank #${userStats.rank || 'N/A'}\n${userStats.badges_earned} badges\n#GreenGrid`
      : `My eco badges! 🏆\n${badges.filter(b => b.earned).map(b => `${b.name} (${b.rarity})`).join('\n')}\n#GreenGrid`

    if (platform === 'instagram') {
      const imageUrl = await generateShareImage(ref as React.RefObject<HTMLDivElement>)
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

  const getNextLevelProgress = () => {
    if (!userStats) return 0;
    const pointsForCurrentLevel = (userStats.level - 1) * 500;
    const pointsForNextLevel = userStats.level * 500;
    const progress = ((userStats.total_points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData || !userStats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
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
                    <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
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
                  <p className="text-gray-600">Eco Warrior since {new Date(profileData.created_at).toLocaleDateString()}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="bg-green-100 text-green-800">Level {userStats.level} - Climate Champion</Badge>
                    <div className="text-xs text-gray-500">
                      {getNextLevelProgress().toFixed(0)}% to Level {userStats.level + 1}
                    </div>
                  </div>
                  <Progress value={getNextLevelProgress()} className="h-1 w-32 mt-2" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <Input
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                      value={profileData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <Select
                      value={profileData.city || ""}
                      onValueChange={(value) => setProfileData(prev => prev ? { ...prev, city: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="pune">Pune</SelectItem>
                        <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team</label>
                    <Select 
                      value={profileData.team_id || ""}
                      onValueChange={(value) => setProfileData(prev => prev ? { ...prev, team_id: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your team" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} - {team.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <Textarea
                      placeholder="Tell us about your eco journey..."
                      value={profileData.bio || ""}
                      onChange={(e) => setProfileData(prev => prev ? { ...prev, bio: e.target.value } : null)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveChanges} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={fetchUserData}>Refresh</Button>
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
                  <div className="text-2xl font-bold text-green-700">{userStats.challenges_completed}</div>
                  <div className="text-sm text-green-600">Challenges Completed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{userStats.total_points}</div>
                  <div className="text-sm text-blue-600">Total EcoPoints</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{userStats.rank || 'N/A'}</div>
                  <div className="text-sm text-yellow-600">Global Rank</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{userStats.badges_earned}</div>
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
                    key={badge.id}
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
              {completedChallenges.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No completed challenges yet. Start your eco journey!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedChallenges.map((challenge, index) => (
                    <div key={challenge.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{challenge.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">Impact: {challenge.impact_description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              +{challenge.points} pts
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(challenge.completed_at).toLocaleDateString()}
                          </div>
                          <CheckCircle className="h-5 w-5 text-green-600 ml-auto mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
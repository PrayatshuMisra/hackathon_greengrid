"use client"
type TeamMember = {
  id: string
  name: string
  email: string
  role: "admin" | "member"
  avatar: string
  points: number
}

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useApp } from "@/app/providers"
import { useRealtime } from "@/lib/realtime"
import { useToast } from "@/hooks/use-toast"
import { Users, Plus, Link, Crown, UserMinus, Settings, Share2, Copy, CheckCircle, QrCode, Upload, AlertCircle } from "lucide-react"

export function TeamManagement() {
  const [isCreating, setIsCreating] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [teamCity, setTeamCity] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user, supabase } = useApp()
  const [userStats, setUserStats] = useState({
    totalPoints: user?.total_points || 0,
  })
  const { teams, updateTeam } = useRealtime()
  const { toast } = useToast()
  const [teamCode, setTeamCode] = useState("")
  const [teamInfo, setTeamInfo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  // Always compute invite link from teamInfo
  const inviteLink = teamInfo ? `${window.location.origin}/join-team/${teamInfo.id}?code=${teamInfo.invite_code}` : ""

  // Helper: check if user is admin
  const isAdmin = teamInfo && teamInfo.members && user && teamInfo.members.some((m: any) => m.id === user.id && m.role === "admin")

  useEffect(() => {
    const fetchTeamInfo = async () => {
      if (user?.team_id) {
        const { data: team, error } = await supabase
          .from("teams")
          .select("*")
          .eq("id", user.team_id)
          .single();
        if (!error && team) {
          const { data: members, error: membersError } = await supabase
            .from("team_members")
            .select("user_id, role, profiles(name, email, avatar_url, total_points)")
            .eq("team_id", team.id);
          if (!membersError && Array.isArray(members)) {
            team.members = members.map((m: any) => ({
              id: m.user_id,
              name: m.profiles?.name || "",
              email: m.profiles?.email || "",
              role: m.role,
              avatar: m.profiles?.avatar_url || "/placeholder.svg",
              points: m.profiles?.total_points || 0,
            }));
          } else {
            team.members = [];
          }
          setTeamInfo(team);
        }
      } else {
        setTeamInfo(null);
      }
    };
    fetchTeamInfo();
  }, [user?.team_id, supabase]);

  // Helper function to update team member count
  const updateTeamMemberCount = async (teamId: string) => {
    try {
      console.log(`Calling update_specific_team_member_count for team ${teamId}`);
      
      const { error } = await supabase.rpc('update_specific_team_member_count', {
        team_id_param: teamId
      });
      
      if (error) {
        console.error('Error updating team member count:', error);
      } else {
        console.log('Team member count update function called successfully');
        
        // Verify the update worked
        const { data: team } = await supabase
          .from("teams")
          .select("member_count")
          .eq("id", teamId)
          .single();
        
        console.log(`Team ${teamId} member count after update: ${team?.member_count}`);
      }
    } catch (error) {
      console.error('Error updating team member count:', error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !teamCity) {
      toast({
        title: "Missing information",
        description: "Please provide a team name and city",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to create a team.",
        variant: "destructive",
      });
      return;
    }
    
    // Handle demo users
    if (user.isDemo) {
      toast({
        title: "Demo Mode",
        description: "Team creation is not available in demo mode. Please create a real account to create teams.",
        variant: "default",
      });
      return;
    }
    
    setLoading(true);
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      // 1. Insert team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: teamName,
          description: teamDescription || `Team ${teamName} from ${teamCity}`,
          city: teamCity,
          created_by: user.id,
          invite_code: inviteCode,
          member_count: 1,
        })
        .select()
        .single();
      if (teamError || !team) throw teamError || new Error("Failed to create team");
      // 2. Add creator as admin in team_members
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "admin" });
      if (memberError) throw memberError;
      // 3. Update user's team_id in profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: team.id })
        .eq("id", user.id);
      if (profileError) throw profileError;
      // 4. Log activity
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "team_join",
        description: `Created and joined team ${team.name}`,
        points_earned: 0,
        related_id: team.id,
        related_type: "team",
      });
      // 5. Refetch team info
      const { data: updatedTeam } = await supabase
        .from("teams")
        .select("*")
        .eq("id", team.id)
        .single();
      if (updatedTeam) {
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id, role, profiles(name, email, avatar_url, total_points)")
          .eq("team_id", updatedTeam.id);
        updatedTeam.members = (members || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.name || "",
          email: m.profiles?.email || "",
          role: m.role,
          avatar: m.profiles?.avatar_url || "/placeholder.svg",
          points: m.profiles?.total_points || 0,
        }));
        setTeamInfo(updatedTeam);
      }
      toast({
        title: "Team Created!",
        description: `Your team \"${teamName}\" has been created and you have joined as admin.`,
        variant: "success",
      });
      setIsCreating(false);
      setShowQrCode(true);
      await updateTeamMemberCount(team.id);
    } catch (error: any) {
      console.error("Team creation error:", error);
      let description = "Failed to create team";
      if (error) {
        if (typeof error === "object") {
          description =
            (error.message ? error.message + "\n" : "") +
            (error.code ? "Code: " + error.code + "\n" : "") +
            (error.details ? "Details: " + error.details : "");
        } else if (typeof error === "string") {
          description = error;
        }
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!teamInfo || !isAdmin || memberId === user?.id) return;
    
    try {
      console.log(`Removing member ${memberId} from team ${teamInfo.id}`);
      
      // Remove from team_members
      const { error: memberError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamInfo.id)
        .eq("user_id", memberId);
      
      if (memberError) throw memberError;
      
      console.log("Member removed from team_members table");
      
      // Update user's team_id to null
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: null })
        .eq("id", memberId);
      
      if (profileError) throw profileError;
      
      console.log("User profile updated to remove team_id");
      
      // Log activity
      await supabase.from("user_activity").insert({
        user_id: memberId,
        activity_type: "team_leave",
        description: `Removed from team ${teamInfo.name}`,
        points_earned: 0,
        related_id: teamInfo.id,
        related_type: "team",
      });
      
      console.log("Activity logged");
      
      // Refetch team info
      const { data: updatedTeam } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamInfo.id)
        .single();
      
      if (updatedTeam) {
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id, role, profiles(name, email, avatar_url, total_points)")
          .eq("team_id", updatedTeam.id);
        
        updatedTeam.members = (members || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.name || "",
          email: m.profiles?.email || "",
          role: m.role,
          avatar: m.profiles?.avatar_url || "/placeholder.svg",
          points: m.profiles?.total_points || 0,
        }));
        setTeamInfo(updatedTeam);
        console.log(`Team updated, new member count: ${updatedTeam.member_count}`);
      }

      toast({
        title: "Member Removed",
        description: "The member has been removed from the team.",
        variant: "default",
      })
      
      // Manually update team member count
      console.log("Manually updating team member count...");
      await updateTeamMemberCount(teamInfo.id);
      
      // Verify the count was updated
      const { data: finalTeam } = await supabase
        .from("teams")
        .select("member_count")
        .eq("id", teamInfo.id)
        .single();
      
      console.log(`Final team member count: ${finalTeam?.member_count}`);
      
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handlePromoteMember = async (memberId: string) => {
    if (!teamInfo || !isAdmin) return;
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: "admin" })
        .eq("team_id", teamInfo.id)
        .eq("user_id", memberId);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Member Promoted", description: "The member has been promoted to admin.", variant: "success" });
      // Refetch team info
      const { data: updatedTeam } = await supabase
        .from("teams")
        .select("*")
        .eq("id", teamInfo.id)
        .single();
      if (updatedTeam) {
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id, role, profiles(name, email, avatar_url, total_points)")
          .eq("team_id", updatedTeam.id);
        updatedTeam.members = (members || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.name || "",
          email: m.profiles?.email || "",
          role: m.role,
          avatar: m.profiles?.avatar_url || "/placeholder.svg",
          points: m.profiles?.total_points || 0,
        }));
        setTeamInfo(updatedTeam);
      }
      await updateTeamMemberCount(teamInfo.id);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to promote member", variant: "destructive" });
    }
  }

  const handleSaveTeamSettings = async () => {
    if (!teamName || !teamCity) {
      toast({
        title: "Missing information",
        description: "Please provide a team name and city.",
        variant: "destructive",
      })
      return
    }

    if (!teamInfo || !isAdmin) {
        toast({ title: "Unauthorized", description: "You do not have permission to edit this team.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .update({
            name: teamName,
            description: teamDescription,
            city: teamCity
        })
        .eq('id', teamInfo.id)
        .select()
        .single();

      if (error) throw error;
      
      // Merge updated data with existing team info to preserve members list
      setTeamInfo((prev: any) => ({ ...prev, ...data }));
      
      toast({
        title: "Team Updated",
        description: "Your team settings have been updated successfully.",
        variant: "success",
      })

      setIsEditing(false)
      await updateTeamMemberCount(teamInfo.id);
    } catch (error: any) {
      console.error("Team update error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      })
    } finally {
        setLoading(false);
    }
  }

  const handleJoinTeam = async (teamCode: string) => {
    console.log("handleJoinTeam called with teamCode:", teamCode);
    console.log("Current user object:", user);
    console.log("User loading state:", loading);
    
    if (!teamCode) {
      toast({
        title: "Missing information",
        description: "Please provide a team code",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      console.log("User is null, showing error message");
      toast({
        title: "Not logged in",
        description: "You must be logged in to join a team.",
        variant: "destructive",
      });
      return;
    }
    
    // Handle demo users
    if (user.isDemo) {
      toast({
        title: "Demo Mode",
        description: "Team functionality is not available in demo mode. Please create a real account to join teams.",
        variant: "default",
      });
      return;
    }
    
    if (user.team_id) {
      toast({
        title: "Already in a team",
        description: "You must leave your current team before joining another.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("*")
        .eq("invite_code", teamCode)
        .single();
      if (teamError || !team) {
        toast({
          title: "Invalid Code",
          description: "No team found with that invite code.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log(`Found team: ${team.name} with current member count: ${team.member_count}`);
      
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "member" });
      if (memberError) throw memberError;
      
      console.log("User added to team_members table");
      
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: team.id })
        .eq("id", user.id);
      if (profileError) throw profileError;
      
      console.log("User profile updated with team_id");
      
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "team_join",
        description: `Joined team ${team.name}`,
        points_earned: 0,
        related_id: team.id,
        related_type: "team",
      });
      
      console.log("Activity logged");
      
      toast({
        title: "Team Joined",
        description: `You have successfully joined ${team.name}.`,
        variant: "success",
      });
      
      // Refetch team info
      const { data: updatedTeam } = await supabase
        .from("teams")
        .select("*")
        .eq("id", team.id)
        .single();
      if (updatedTeam) {
        console.log(`Team refetched, member count: ${updatedTeam.member_count}`);
        
        const { data: members } = await supabase
          .from("team_members")
          .select("user_id, role, profiles(name, email, avatar_url, total_points)")
          .eq("team_id", updatedTeam.id);
        updatedTeam.members = (members || []).map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.name || "",
          email: m.profiles?.email || "",
          role: m.role,
          avatar: m.profiles?.avatar_url || "/placeholder.svg",
          points: m.profiles?.total_points || 0,
        }));
        setTeamInfo(updatedTeam);
        console.log(`Team members fetched: ${members?.length || 0} members`);
      }
      
      // Manually update team member count
      console.log("Manually updating team member count...");
      await updateTeamMemberCount(team.id);
      
      // Verify the count was updated
      const { data: finalTeam } = await supabase
        .from("teams")
        .select("member_count")
        .eq("id", team.id)
        .single();
      
      console.log(`Final team member count: ${finalTeam?.member_count}`);
      
    } catch (error: any) {
      console.error("Join team error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!teamInfo || !user) return;
    
    if (confirm("Are you sure you want to leave this team?")) {
      try {
        // Remove from team_members
        const { error: memberError } = await supabase
          .from("team_members")
          .delete()
          .eq("team_id", teamInfo.id)
          .eq("user_id", user.id);
        
        if (memberError) throw memberError;
        
        // Update user's team_id to null
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ team_id: null })
          .eq("id", user.id);
        
        if (profileError) throw profileError;
        
        // Log activity
        await supabase.from("user_activity").insert({
          user_id: user.id,
          activity_type: "team_leave",
          description: `Left team ${teamInfo.name}`,
          points_earned: 0,
          related_id: teamInfo.id,
          related_type: "team",
        });
        
        // Clear team info
        setTeamInfo(null);

        toast({
          title: "Team Left",
          description: "You have left the team successfully.",
          variant: "default",
        })
        await updateTeamMemberCount(teamInfo.id);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to leave team",
          variant: "destructive",
        })
      }
    }
  }

  // Debug function to check authentication state
  const checkAuthState = async () => {
    console.log("Checking authentication state...");
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log("Session check result:", { session, error });
      
      if (session?.user) {
        console.log("Session user found:", session.user);
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        console.log("Profile check result:", { profile, profileError });
        
        if (profile) {
          toast({
            title: "Profile Found",
            description: `Profile exists for ${profile.email}`,
            variant: "success",
          });
        } else {
          toast({
            title: "Profile Missing",
            description: "No profile found for this user. Click 'Create Profile' to fix this.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "No Session",
          description: "No active session found. Please log in first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth check error:", error);
      toast({
        title: "Error",
        description: "Failed to check authentication state",
        variant: "destructive",
      });
    }
  };

  // Function to manually create a user profile
  const createUserProfile = async () => {
    console.log("Creating user profile...");
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "No Session",
          description: "Please log in first before creating a profile.",
          variant: "destructive",
        });
        return;
      }

      const userData = {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.full_name || 
              session.user.user_metadata?.name || 
              session.user.email?.split("@")[0] || 
              "User",
        avatar_url: session.user.user_metadata?.avatar_url || null,
        total_points: 0,
        level: 1,
        team_id: null,
        latitude: 28.6139,
        longitude: 77.209,
        city: "Delhi",
        rank: 0,
      };

      console.log("Creating profile with data:", userData);

      const { error: insertError } = await supabase
        .from("profiles")
        .insert(userData);

      if (insertError) {
        console.error("Profile creation error:", insertError);
        toast({
          title: "Error",
          description: `Failed to create profile: ${insertError.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Profile created successfully");
        toast({
          title: "Profile Created",
          description: "User profile created successfully. Please refresh the page.",
          variant: "success",
        });
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("Profile creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create user profile",
        variant: "destructive",
      });
    }
  };

  // Handle team image upload
  const handleTeamImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !teamInfo || !isAdmin) return
    const file = e.target.files[0]
    if (!file) return
    const fileExt = file.name.split('.').pop()
    const filePath = `team-avatars/${teamInfo.id}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file, { upsert: true })
    if (uploadError) {
      toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" })
      return
    }
    const publicUrl = supabase.storage.from('public').getPublicUrl(filePath).data.publicUrl
    // Update team profile_image_url
    const { error: updateError } = await supabase.from('teams').update({ profile_image_url: publicUrl }).eq('id', teamInfo.id)
    if (updateError) {
      toast({ title: "Update Error", description: updateError.message, variant: "destructive" })
      return
    }
    // Refetch team info
    const { data: updatedTeam } = await supabase.from("teams").select("*").eq("id", teamInfo.id).single()
    if (updatedTeam) setTeamInfo({ ...teamInfo, profile_image_url: updatedTeam.profile_image_url })
    toast({ title: "Team Image Updated", description: "Profile image updated successfully.", variant: "success" })
    await updateTeamMemberCount(teamInfo.id);
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Team Management</CardTitle>
          <CardDescription>Manage your team settings and members.</CardDescription>
          {user?.isDemo && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Demo Mode</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Team functionality is limited in demo mode. Create a real account to join and create teams.
              </p>
            </div>
          )}
          
          {/* Debug Information */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>User: {user ? `${user.name} (${user.email})` : 'null'}</p>
              <p>User ID: {user?.id || 'null'}</p>
              <p>Is Demo: {user?.isDemo ? 'Yes' : 'No'}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Team ID: {user?.team_id || 'null'}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                console.log("Manual refresh triggered");
                window.location.reload();
              }}
            >
              Refresh Auth State
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 ml-2"
              onClick={checkAuthState}
            >
              Check Auth State
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 ml-2"
              onClick={createUserProfile}
            >
              Create Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Team Info or Join/Create UI */}
          {teamInfo ? (
            isEditing ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Edit Team Information</h3>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                        <label htmlFor="team-name-edit">Team Name</label>
                        <Input id="team-name-edit" placeholder="Enter team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} required/>
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="team-desc-edit">Description</label>
                        <Textarea id="team-desc-edit" placeholder="Enter team description" value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="team-city-edit">City</label>
                        <Input id="team-city-edit" placeholder="Enter city" value={teamCity} onChange={(e) => setTeamCity(e.target.value)} required/>
                    </div>
                    <div className="flex space-x-2">
                        <Button onClick={handleSaveTeamSettings} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={loading}>
                            Cancel
                        </Button>
                    </div>
                  </div>
                </div>
            ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Team Information</h3>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => {
                        if (!teamInfo) return;
                        setTeamName(teamInfo.name);
                        setTeamDescription(teamInfo.description || "");
                        setTeamCity(teamInfo.city);
                        setIsEditing(true);
                    }}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={teamInfo.profile_image_url || "/placeholder.svg"} alt="Team Avatar" />
                    <AvatarFallback>
                      {teamInfo.name
                        .split(" ")
                        .map((word: string) => word[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isAdmin && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleTeamImageChange}
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Change Image
                      </Button>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold">{teamInfo.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created on {new Date(teamInfo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="mt-2">{teamInfo.description}</p>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge variant="secondary">
                    <Users className="w-4 h-4 mr-1" />
                    {teamInfo.member_count || 0} Members
                  </Badge>
                  <Badge variant="outline">
                    <Crown className="w-4 h-4 mr-1" />
                    Rank: {teamInfo.rank}
                  </Badge>
                  <Badge>
                    <Link className="w-4 h-4 mr-1" />
                    {teamInfo.city}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleLeaveTeam}>
                    <UserMinus className="w-4 h-4 mr-1" />
                    Leave Team
                  </Button>
                </div>
                {/* Invite by Link, QR (admin only) */}
                {isAdmin && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <Input type="text" value={inviteLink} readOnly className="flex-grow" />
                      <Button variant="ghost" onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(inviteLink);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        } catch (error) {
                          // Fallback for browsers that don't support clipboard API
                          const textArea = document.createElement('textarea');
                          textArea.value = inviteLink;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }
                      }}>
                        {linkCopied ? (<><CheckCircle className="w-4 h-4 mr-2" />Copied!</>) : (<><Copy className="w-4 h-4 mr-2" />Copy</>)}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost">
                            <QrCode className="w-4 h-4 mr-2" />
                            Show QR Code
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Scan QR Code to Join</DialogTitle>
                            <DialogDescription>Scan this QR code with your mobile device to join the team.</DialogDescription>
                          </DialogHeader>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`}
                            alt="QR Code"
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}
              </div>
              {/* Team Members */}
              {teamInfo.members && teamInfo.members.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Team Members</h3>
                  <ul className="space-y-3">
                    {teamInfo.members.map((member: any) => (
                      <li key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>
                              {member.name
                                .split(" ")
                                .map((word: string) => word[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isAdmin && member.role !== "admin" && member.id !== user.id && (
                            <Button variant="secondary" size="sm" onClick={() => handlePromoteMember(member.id)}>
                              <Crown className="w-4 h-4 mr-1" />
                              Promote
                            </Button>
                          )}
                          {isAdmin && (
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveMember(member.id)}>
                              <UserMinus className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
           )
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-2">Join a Team</h3>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="teamCode">Team Code</label>
                    <Input
                      id="teamCode"
                      placeholder="Enter team invite code"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value)}
                      disabled={!!user?.team_id}
                    />
                  </div>
                </div>
                <Button onClick={() => handleJoinTeam(teamCode)} disabled={!!user?.team_id || loading}>
                  {loading ? "Joining..." : "Join Team"}
                </Button>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Or Create a New Team</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create a New Team</DialogTitle>
                      <DialogDescription>Create a new team to collaborate with others.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam}>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="name">Team Name</label>
                          <Input
                            id="name"
                            placeholder="Enter team name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="description">Description</label>
                          <Textarea
                            id="description"
                            placeholder="Enter team description"
                            value={teamDescription}
                            onChange={(e) => setTeamDescription(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="city">City</label>
                          <Input
                            id="city"
                            placeholder="Enter city"
                            value={teamCity}
                            onChange={(e) => setTeamCity(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Team"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

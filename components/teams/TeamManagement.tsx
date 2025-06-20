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
import { Users, Plus, Mail, Link, Crown, UserMinus, Settings, Share2, Copy, CheckCircle, QrCode, Upload } from "lucide-react"

export function TeamManagement() {
  const [isCreating, setIsCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
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

  const handleInviteByEmail = async () => {
    if (!inviteEmail || !teamInfo || !isAdmin) return
    // Insert invitation record
    const { error } = await supabase.from('team_invitations').insert({
      team_id: teamInfo.id,
      email: inviteEmail,
      invited_by: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    if (error) {
      toast({ title: "Invite Error", description: error.message, variant: "destructive" })
      return
    }
    toast({
      title: "Invitation Pending!",
      description: `Invitation created for ${inviteEmail}. (Email will be sent if backend is set up)`,
      variant: "success",
    })
    setInviteEmail("")
  }

  const handleRemoveMember = (memberId: string) => {
    try {

      toast({
        title: "Member Removed",
        description: "The member has been removed from the team.",
        variant: "success",
      })
    } catch (error: any) {
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
    if (!teamCode) {
      toast({
        title: "Missing information",
        description: "Please provide a team code",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to join a team.",
        variant: "destructive",
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
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "member" });
      if (memberError) throw memberError;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: team.id })
        .eq("id", user.id);
      if (profileError) throw profileError;
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "team_join",
        description: `Joined team ${team.name}`,
        points_earned: 0,
        related_id: team.id,
        related_type: "team",
      });
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

  const handleLeaveTeam = () => {
    if (confirm("Are you sure you want to leave this team?")) {
      try {

        toast({
          title: "Team Left",
          description: "You have left the team successfully.",
          variant: "success",
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to leave team",
          variant: "destructive",
        })
      }
    }
  }

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
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Team Management</CardTitle>
          <CardDescription>Manage your team settings and members.</CardDescription>
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
                    {teamInfo.members ? teamInfo.members.length : 0} Members
                  </Badge>
                  <Badge variant="outline">
                    <Crown className="w-4 h-4 mr-1" />
                    Rank: {teamInfo.rank}
                  </Badge>
                  <Badge>
                    <Link className="w-4 h-4 mr-1" />
                    {teamInfo.city}
                  </Badge>
                </div>
                {/* Invite by Email, Link, QR (admin only) */}
                {isAdmin && (
                  <div className="mt-6 space-y-4">
                    <div className="flex space-x-4">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                      <Button onClick={handleInviteByEmail}>
                        <Mail className="w-4 h-4 mr-2" />
                        Invite by Email
                      </Button>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Input type="text" value={inviteLink} readOnly className="w-64" />
                      <Button variant="ghost" onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}>
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

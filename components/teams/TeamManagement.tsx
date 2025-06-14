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

import { useState } from "react"
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
import { Users, Plus, Mail, Link, Crown, UserMinus, Settings, Share2, Copy, CheckCircle, QrCode } from "lucide-react"

export function TeamManagement() {
  const [isCreating, setIsCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [teamCity, setTeamCity] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useApp()
  const [userStats, setUserStats] = useState({
    totalPoints: user?.total_points || 0,
  })
  const { teams, updateTeam } = useRealtime()
  const { toast } = useToast()
  const [teamCode, setTeamCode] = useState("")

  const currentTeamFallback = teams.find((t) => t.id === user?.team_id) || {
    id: "1",
    name: "EcoWarriors Delhi",
    description: "Passionate eco-warriors from Delhi working together for a sustainable future",
    members: [
      { id: "1", name: "Salman Khan", email: "salman@email.com", role: "admin", avatar: "/placeholder.svg", points: 2340 },
      {
        id: "2",
        name: "Shahrukh Khan",
        email: "shahrukh@email.com",
        role: "member",
        avatar: "/placeholder.svg",
        points: 1890,
      },
      {
        id: "3",
        name: "Tony Stark",
        email: "tony@email.com",
        role: "member",
        avatar: "/placeholder.svg",
        points: 1650,
      },
      {
        id: "4",
        name: "Cristiano",
        email: "cr7@email.com",
        role: "member",
        avatar: "/placeholder.svg",
        points: 1420,
      },
    ],
    totalPoints: 7300,
    rank: 1,
    created_at: "2024-03-15",
    city: "Delhi",
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamName || !teamCity) {
      toast({
        title: "Missing information",
        description: "Please provide a team name and city",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const newTeam = {
        id: Math.random().toString(),
        name: teamName,
        description: teamDescription || `Team ${teamName} from ${teamCity}`,
        city: teamCity,
        members: [
          {
            id: user?.id || "1",
            name: user?.name || "Current User",
            email: user?.email || "user@example.com",
            role: "admin",
            avatar: user?.avatar_url || "/placeholder.svg",
            points: userStats.totalPoints || 0,
          },
        ],
        totalPoints: userStats.totalPoints || 0,
        rank: 0,
        created_at: new Date().toISOString(),
        invite_code: inviteCode,
      }

      const inviteLink = `${window.location.origin}/join-team/${newTeam.id}?code=${inviteCode}`
      setInviteLink(inviteLink)

      setCurrentTeam(newTeam)

      toast({
        title: "Team Created!",
        description: `Your team "${teamName}" has been created successfully.`,
        variant: "success",
      })

      setIsCreating(false)
      setShowQrCode(true)
    } catch (error: any) {
      console.error("Team creation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteByEmail = async () => {
    if (!inviteEmail) return

    try {

      toast({
        title: "Invitation Sent!",
        description: `Invitation sent to ${inviteEmail}!`,
        variant: "success",
      })

      setInviteEmail("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  const generateInviteLink = () => {
    const link = `${window.location.origin}/join-team/${currentTeamFallback.id}?token=abc123`
    setInviteLink(link)
  }

  const copyInviteLink = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
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

  const handlePromoteMember = (memberId: string) => {
    try {

      toast({
        title: "Member Promoted",
        description: "The member has been promoted to admin.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to promote member",
        variant: "destructive",
      })
    }
  }

  const handleSaveTeamSettings = () => {
    if (!teamName) {
      toast({
        title: "Missing information",
        description: "Please provide a team name",
        variant: "destructive",
      })
      return
    }

    try {

      setCurrentTeam((prev: any) => ({
        ...prev,
        name: teamName,
        description: teamDescription,
        city: teamCity,
      }))

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
    }
  }

  const handleJoinTeam = (teamCode: string) => {
    if (!teamCode) {
      toast({
        title: "Missing information",
        description: "Please provide a team code",
        variant: "destructive",
      })
      return
    }

    try {

      toast({
        title: "Team Joined",
        description: "You have successfully joined the team.",
        variant: "success",
      })

    } catch (error: any) {
      console.error("Join team error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive",
      })
    }
  }

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

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Team Management</CardTitle>
          <CardDescription>Manage your team settings and members.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {/* Team Info */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Team Information</h3>
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="/placeholder.svg" alt="Team Avatar" />
                <AvatarFallback>
                  {(currentTeam ? currentTeam.name : currentTeamFallback.name)
                    .split(" ")
                    .map((word: string) => word[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-xl font-bold">{currentTeam ? currentTeam.name : currentTeamFallback.name}</h4>
                <p className="text-sm text-gray-500">
                  Created on{" "}
                  {new Date(currentTeam ? currentTeam.created_at : currentTeamFallback.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="mt-2">{currentTeam ? currentTeam.description : currentTeamFallback.description}</p>
            <div className="mt-4 flex items-center space-x-2">
              <Badge variant="secondary">
                <Users className="w-4 h-4 mr-1" />
                {(currentTeam ? currentTeam.members : currentTeamFallback.members).length} Members
              </Badge>
              <Badge variant="outline">
                <Crown className="w-4 h-4 mr-1" />
                Rank: {currentTeam ? currentTeam.rank : currentTeamFallback.rank}
              </Badge>
              <Badge>
                <Link className="w-4 h-4 mr-1" />
                {currentTeam ? currentTeam.city : currentTeamFallback.city}
              </Badge>
            </div>
          </div>

          {/* Team Actions */}
          <div className="flex justify-between items-center">
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Team Settings</DialogTitle>
                    <DialogDescription>Make changes to your team here. Click save when you're done.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="name">Team Name</label>
                      <Input id="name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="description">Description</label>
                      <Textarea
                        id="description"
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="city">City</label>
                      <Input id="city" value={teamCity} onChange={(e) => setTeamCity(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={handleSaveTeamSettings}>Save changes</Button>
                </DialogContent>
              </Dialog>
            </div>
            <Button variant="destructive" onClick={handleLeaveTeam}>
              Leave Team
            </Button>
            {/* Join Team Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="ml-2">
                  <Users className="w-4 h-4 mr-2" />
                  Join Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Join a Team</DialogTitle>
                  <DialogDescription>Enter a team invite code or scan a QR code to join.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="teamCode">Team Code</label>
                    <Input
                      id="teamCode"
                      placeholder="Enter team invite code"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => handleJoinTeam(teamCode)}>Join Team</Button>
              </DialogContent>
            </Dialog>
          </div>

          {/* Invite Members */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Invite Members</h3>
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
            <div className="mt-4 flex items-center space-x-4">
              <Button variant="secondary" onClick={generateInviteLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Generate Invite Link
              </Button>
              {inviteLink && (
                <div className="flex items-center space-x-2">
                  <Input type="text" value={inviteLink} readOnly className="w-64" />
                  <Button variant="ghost" onClick={copyInviteLink} disabled={linkCopied}>
                    {linkCopied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              )}
              {inviteLink && (
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${inviteLink}`}
                      alt="QR Code"
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Team Members</h3>
            <ul className="space-y-3">
              {(currentTeam ? currentTeam.members : currentTeamFallback.members).map((member: TeamMember) => (
                <li key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((word) => word[0])
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
                    {member.role !== "admin" && (
                      <Button variant="secondary" size="sm" onClick={() => handlePromoteMember(member.id)}>
                        <Crown className="w-4 h-4 mr-1" />
                        Promote
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveMember(member.id)}>
                      <UserMinus className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Create Team */}
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
        </CardContent>
      </Card>
    </div>
  )
}

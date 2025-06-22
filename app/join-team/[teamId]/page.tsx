"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useApp } from "@/app/providers"
import { useToast } from "@/hooks/use-toast"
import { Users, Crown, MapPin, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function JoinTeamPage({ params }: { params: { teamId: string } }) {
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const [invitationValid, setInvitationValid] = useState(false)
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code')
  const { user, supabase } = useApp()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        // Fetch team information
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', params.teamId)
          .single()

        if (teamError || !teamData) {
          setInvitationValid(false)
          setLoading(false)
          return
        }

        // Check if invite code matches
        if (inviteCode && teamData.invite_code !== inviteCode) {
          setInvitationValid(false)
          setLoading(false)
          return
        }

        setTeam(teamData)
        setInvitationValid(true)

        // Check if user is logged in
        if (user) {
          setUserExists(true)
          
          // Check if user is already in this team
          if (user.team_id === params.teamId) {
            toast({
              title: "Already in team",
              description: "You are already a member of this team.",
              variant: "default",
            })
          }
        } else {
          setUserExists(false)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching team info:', error)
        setInvitationValid(false)
        setLoading(false)
      }
    }

    fetchTeamInfo()
  }, [params.teamId, inviteCode, user, supabase, toast])

  const handleJoinTeam = async () => {
    if (!user || !team || !inviteCode) return

    if (user.team_id) {
      toast({
        title: "Already in a team",
        description: "You must leave your current team before joining another.",
        variant: "destructive",
      })
      return
    }

    setJoining(true)
    try {
      // Add user to team_members
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({ team_id: team.id, user_id: user.id, role: "member" })

      if (memberError) throw memberError

      // Update user's team_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ team_id: team.id })
        .eq("id", user.id)

      if (profileError) throw profileError

      // Log activity
      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "team_join",
        description: `Joined team ${team.name}`,
        points_earned: 0,
        related_id: team.id,
        related_type: "team",
      })

      toast({
        title: "Team Joined!",
        description: `You have successfully joined ${team.name}.`,
        variant: "default",
      })

      // Redirect to teams page
      window.location.href = '/teams'
    } catch (error: any) {
      console.error('Join team error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p>Loading team information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitationValid) {
    return (
      <div className="container mx-auto py-10">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              The team invitation you're trying to access is no longer valid. This could be because:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>The invitation has expired</li>
              <li>The invite code is incorrect</li>
              <li>The team no longer exists</li>
            </ul>
            <div className="flex space-x-4">
              <Button asChild>
                <Link href="/teams">
                  Go to Teams
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
            Team Invitation
          </CardTitle>
          <CardDescription>
            You've been invited to join a team on GreenGrid
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Information */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={team?.profile_image_url || "/placeholder.svg"} alt="Team Avatar" />
              <AvatarFallback>
                {team?.name
                  ?.split(" ")
                  .map((word: string) => word[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{team?.name}</h3>
              <p className="text-gray-600">{team?.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="secondary">
                  <MapPin className="w-3 h-3 mr-1" />
                  {team?.city}
                </Badge>
                <Badge variant="outline">
                  <Users className="w-3 h-3 mr-1" />
                  {team?.member_count || 0} members
                </Badge>
                {team?.rank && (
                  <Badge>
                    <Crown className="w-3 h-3 mr-1" />
                    Rank #{team.rank}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Section */}
          {userExists ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Welcome back!</h4>
                <p className="text-green-700">
                  You already have a GreenGrid account. Click the button below to join this team.
                </p>
              </div>
              
              {user?.team_id === params.teamId ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Already a member</h4>
                  <p className="text-blue-700">
                    You are already a member of this team.
                  </p>
                  <Button asChild className="mt-2">
                    <Link href="/teams">
                      Go to Team Dashboard
                    </Link>
                  </Button>
                </div>
              ) : user?.team_id ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Team membership required</h4>
                  <p className="text-yellow-700">
                    You are currently a member of another team. You must leave your current team before joining this one.
                  </p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/teams">
                      Manage Teams
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleJoinTeam} 
                  disabled={joining}
                  className="w-full"
                  size="lg"
                >
                  {joining ? "Joining..." : "Join Team"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">New to GreenGrid?</h4>
                <p className="text-blue-700 mb-4">
                  You don't have a GreenGrid account yet. Create one to join this team and start your eco journey!
                </p>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link href="/auth/signup">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Create Account & Join Team
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/auth/login">
                      Already have an account? Sign in
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Save this team code:</h4>
                <div className="bg-white border-2 border-green-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600 mb-1">Team Code</p>
                  <p className="text-2xl font-bold text-green-600">{team?.invite_code}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use this code after creating your account
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* What you can do section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">What you can do on GreenGrid:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Complete eco-challenges and earn points</li>
              <li>• Track your environmental impact</li>
              <li>• Compete on leaderboards with your team</li>
              <li>• Earn badges and certificates</li>
              <li>• Join events and workshops</li>
              <li>• Connect with like-minded people</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AIVerification } from "@/components/ai/AIVerification"
import { useApp } from "@/app/providers"
import { useToast } from "@/hooks/use-toast"
import { Target, Upload, UserPlus } from "lucide-react"
import { getAvailableChallenges, enrollUserInChallenge, checkUserEnrollment } from "@/lib/supabase"

export function QuickActions() {
  const [joinChallengeOpen, setJoinChallengeOpen] = useState(false)
  const [submitProofOpen, setSubmitProofOpen] = useState(false)
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [selectedChallengeType, setSelectedChallengeType] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [availableChallenges, setAvailableChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { supabase, user } = useApp()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await getAvailableChallenges()
        if (error) {
          console.error("Error fetching challenges:", error)
        } else {
          setAvailableChallenges(data || [])
        }
      } catch (error) {
        console.error("Error fetching challenges:", error)
      }
    }

    fetchChallenges()
  }, [user?.id])

  const handleJoinChallenge = async () => {
    if (!selectedChallenge || !user?.id) return

    setLoading(true)

    try {
      // Check if user is already enrolled
      const { enrolled } = await checkUserEnrollment(user.id, selectedChallenge)
      
      if (enrolled) {
        toast({
          title: "Already Enrolled",
          description: "You are already enrolled in this challenge.",
          variant: "default",
        })
        setJoinChallengeOpen(false)
        return
      }

      // Enroll user in challenge
      const { success, error } = await enrollUserInChallenge(user.id, selectedChallenge)
      
      if (!success) {
        throw error
      }

      const challenge = availableChallenges.find(c => c.id === selectedChallenge)
      
      toast({
        title: "Thank you for joining!",
        description: `You've successfully joined the ${challenge?.title || 'challenge'}`,
        variant: "success",
      })

      setJoinChallengeOpen(false)
      router.push("/challenges")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join challenge",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationComplete = async (result: any) => {
    if (result.success) {
      try {
        toast({
          title: "Verification Successful!",
          description: "Your challenge proof has been verified.",
          variant: "success",
        })

        setSubmitProofOpen(false)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to process verification",
          variant: "destructive",
        })
      }
    }
  }

  const handleInviteFriend = async () => {
    if (!inviteEmail) return

    try {
      toast({
        title: "Invitation Sent!",
        description: `An invitation has been sent to ${inviteEmail}`,
        variant: "success",
      })

      setInviteEmail("")
      setInviteFriendsOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Join New Challenge Dialog */}
      <Dialog open={joinChallengeOpen} onOpenChange={setJoinChallengeOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Join New Challenge
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Challenge</DialogTitle>
            <DialogDescription>Select a challenge to join and make a positive impact</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={(value) => setSelectedChallenge(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a challenge" />
              </SelectTrigger>
              <SelectContent>
                {availableChallenges.map((challenge) => (
                  <SelectItem key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setJoinChallengeOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleJoinChallenge}
                disabled={!selectedChallenge || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Joining..." : "Join Challenge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Proof Dialog */}
      <Dialog open={submitProofOpen} onOpenChange={setSubmitProofOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Submit Proof
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit Challenge Proof</DialogTitle>
            <DialogDescription>
              Upload proof of your eco-action for AI verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select onValueChange={(value) => setSelectedChallengeType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select challenge type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plastic-free">Plastic-Free Challenge</SelectItem>
                <SelectItem value="bike-commute">Bike Commute Challenge</SelectItem>
                <SelectItem value="energy-bill">Energy Saver Challenge</SelectItem>
                <SelectItem value="composting">Composting Challenge</SelectItem>
                <SelectItem value="plant-growing">Plant Growing Challenge</SelectItem>
              </SelectContent>
            </Select>
            {selectedChallengeType && (
              <AIVerification
                challengeType={selectedChallengeType}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Friends Dialog */}
      <Dialog open={inviteFriendsOpen} onOpenChange={setInviteFriendsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friends
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Friends</DialogTitle>
            <DialogDescription>
              Share the eco-journey with your friends and family
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Personal Message (Optional)
              </label>
              <Textarea
                id="message"
                placeholder="Hey! Join me in making a positive impact on the environment..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setInviteFriendsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInviteFriend}
                disabled={!inviteEmail}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

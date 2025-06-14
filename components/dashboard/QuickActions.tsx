"use client"

import { useState } from "react"
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

export function QuickActions() {
  const [joinChallengeOpen, setJoinChallengeOpen] = useState(false)
  const [submitProofOpen, setSubmitProofOpen] = useState(false)
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null)
  const [selectedChallengeType, setSelectedChallengeType] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const { supabase, user } = useApp()
  const { toast } = useToast()
  const router = useRouter()

  // Simulated challenges data - in a real app, fetch from Supabase
  const activeChallenges = [
    { id: "1", title: "Plastic-Free Week Challenge", type: "plastic-free" },
    { id: "2", title: "Bike to Work/School", type: "bike-commute" },
    { id: "3", title: "Energy Saver Challenge", type: "energy-bill" },
    { id: "4", title: "Home Composting", type: "composting" },
    { id: "5", title: "Grow Your Own Herbs", type: "plant-growing" },
  ]

  const handleJoinChallenge = async () => {
    if (!selectedChallenge) return

    try {
      // In a real app, this would insert into the user_challenges table
      // For now, we'll simulate success

      toast({
        title: "Thank you for joining!",
        description: `You've successfully joined the ${activeChallenges.find((c) => c.id === selectedChallenge)?.title}`,
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
    }
  }

  const handleVerificationComplete = async (result: any) => {
    if (result.success) {
      try {
        // In a real app, this would update the challenge progress
        // For now, we'll simulate success

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
      // In a real app, this would send an invitation
      // For now, we'll simulate success

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
                {activeChallenges.map((challenge) => (
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
                disabled={!selectedChallenge}
                className="bg-green-600 hover:bg-green-700"
              >
                Join Challenge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Proof Dialog */}
      <Dialog open={submitProofOpen} onOpenChange={setSubmitProofOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Submit Proof
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit Challenge Proof</DialogTitle>
            <DialogDescription>Upload proof of your eco-action for verification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select
              onValueChange={(value) => {
                setSelectedChallenge(value)
                const challenge = activeChallenges.find((c) => c.id === value)
                if (challenge) {
                  setSelectedChallengeType(challenge.type)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a challenge" />
              </SelectTrigger>
              <SelectContent>
                {activeChallenges.map((challenge) => (
                  <SelectItem key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </SelectItem>
                ))}
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
          <Button variant="outline" className="w-full" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Friends
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Friends</DialogTitle>
            <DialogDescription>Invite friends to join GreenGrid and make a bigger impact together</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Textarea placeholder="Add a personal message (optional)" className="resize-none" />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setInviteFriendsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteFriend} disabled={!inviteEmail} className="bg-green-600 hover:bg-green-700">
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

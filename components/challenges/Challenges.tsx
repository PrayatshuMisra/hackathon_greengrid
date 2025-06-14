"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AIVerification } from "@/components/ai/AIVerification"
import { Camera, Upload, Calendar, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/app/providers"

export function Challenges() {
  const { toast } = useToast()
  const { user, supabase } = useApp()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("active")
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joiningChallenge, setJoiningChallenge] = useState(false)

  const [challenges, setChallenges] = useState([
    {
      id: 1,
      title: "Plastic-Free Week Challenge",
      description: "Avoid single-use plastics for 7 consecutive days",
      category: "Waste Reduction",
      points: 150,
      participants: 1247,
      timeLeft: "3 days",
      difficulty: "Medium",
      impact: "5kg plastic saved",
      status: "active",
      type: "plastic-free",
      joined: false,
    },
    {
      id: 2,
      title: "Bike to Work/School",
      description: "Use bicycle for daily commute for 5 days",
      category: "Transportation",
      points: 200,
      participants: 892,
      timeLeft: "1 week",
      difficulty: "Easy",
      impact: "12kg CO₂ reduced",
      status: "active",
      type: "bike-commute",
      joined: false,
    },
    {
      id: 3,
      title: "Energy Saver Challenge",
      description: "Reduce electricity consumption by 20%",
      category: "Energy",
      points: 300,
      participants: 634,
      timeLeft: "2 weeks",
      difficulty: "Hard",
      impact: "25kWh saved",
      status: "active",
      type: "energy-bill",
      joined: false,
    },
    {
      id: 4,
      title: "Home Composting",
      description: "Start composting kitchen waste",
      category: "Waste Reduction",
      points: 180,
      participants: 445,
      timeLeft: "5 days",
      difficulty: "Medium",
      impact: "3kg waste diverted",
      status: "completed",
      type: "composting",
      joined: false,
    },
    {
      id: 5,
      title: "Grow Your Own Herbs",
      description: "Plant and maintain a small herb garden",
      category: "Food",
      points: 120,
      participants: 328,
      timeLeft: "10 days",
      difficulty: "Easy",
      impact: "Local food production",
      status: "active",
      type: "plant-growing",
      joined: false,
    },
    {
      id: 6,
      title: "Water Conservation",
      description: "Reduce water usage by 15%",
      category: "Water",
      points: 250,
      participants: 512,
      timeLeft: "2 weeks",
      difficulty: "Medium",
      impact: "500L water saved",
      status: "active",
      type: "water-bill",
      joined: false,
    },
  ])

  const filteredChallenges = challenges.filter((challenge) => {
    if (selectedCategory !== "all" && challenge.category.toLowerCase() !== selectedCategory) return false
    if (selectedStatus !== "all" && challenge.status !== selectedStatus) return false
    return true
  })

  const handleVerificationComplete = (result: any) => {
    console.log("Verification result:", result)
    // Handle verification result
    if (result.success) {
      // Update challenge progress, award points, etc.
    }
  }

  const openJoinDialog = (challenge: any) => {
    setSelectedChallenge(challenge)
    setJoinDialogOpen(true)
  }

  const handleJoinChallenge = async () => {
    if (!selectedChallenge) return

    setJoiningChallenge(true)

    try {
      // In a real app, this would insert into the user_challenges table
      // For now, we'll simulate success with a state update

      // Update the challenges state to mark this challenge as joined
      const updatedChallenges = challenges.map((challenge) =>
        challenge.id === selectedChallenge.id
          ? { ...challenge, joined: true, participants: challenge.participants + 1 }
          : challenge,
      )

      setChallenges(updatedChallenges)

      // Close the dialog
      setJoinDialogOpen(false)

      // Show success message
      toast({
        title: "Thank you for joining!",
        description: `You've successfully joined the ${selectedChallenge.title}`,
        variant: "success",
      })
    } catch (error: any) {
      console.error("Error joining challenge:", error)
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      })
    } finally {
      setJoiningChallenge(false)
    }
  }

  const handleSubmitProof = (challenge: any) => {
    setSelectedChallenge(challenge)
    setShowVerification(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Eco Challenges</h2>
          <p className="text-green-600">Join challenges and make a positive impact</p>
        </div>
        <div className="flex space-x-2">
          <Select defaultValue={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="energy">Energy</SelectItem>
              <SelectItem value="waste reduction">Waste Reduction</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="food">Food</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Challenge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChallenges.map((challenge) => (
          <Card key={challenge.id} className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge
                  variant="secondary"
                  className={`${
                    challenge.category === "Energy"
                      ? "bg-yellow-100 text-yellow-800"
                      : challenge.category === "Transportation"
                        ? "bg-blue-100 text-blue-800"
                        : challenge.category === "Water"
                          ? "bg-cyan-100 text-cyan-800"
                          : challenge.category === "Food"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                  }`}
                >
                  {challenge.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${
                    challenge.difficulty === "Easy"
                      ? "border-green-300 text-green-700"
                      : challenge.difficulty === "Medium"
                        ? "border-yellow-300 text-yellow-700"
                        : "border-red-300 text-red-700"
                  }`}
                >
                  {challenge.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-green-800">{challenge.title}</CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reward</span>
                  <span className="font-semibold text-green-600">{challenge.points} EcoPoints</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Impact</span>
                  <span className="font-semibold text-blue-600">{challenge.impact}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Participants</span>
                  <span className="font-semibold">{challenge.participants}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time Left</span>
                  <span className="font-semibold text-orange-600">{challenge.timeLeft}</span>
                </div>

                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                  disabled={challenge.status === "completed" || challenge.joined}
                  onClick={() => openJoinDialog(challenge)}
                >
                  {challenge.status === "completed"
                    ? "Completed"
                    : challenge.joined
                      ? "Already Joined"
                      : "Join Challenge"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Join Challenge Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join {selectedChallenge?.title}</DialogTitle>
            <DialogDescription>
              Ready to take on this eco-challenge? You'll earn {selectedChallenge?.points} EcoPoints upon completion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Challenge Details:</h4>
              <p className="text-sm text-green-700">{selectedChallenge?.description}</p>
              <p className="text-sm text-green-600 mt-2">Expected Impact: {selectedChallenge?.impact}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleJoinChallenge}
                disabled={joiningChallenge}
              >
                {joiningChallenge ? "Joining..." : "Accept Challenge"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof Submission Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-green-600" />
            <span>Submit Challenge Proof</span>
          </CardTitle>
          <CardDescription>
            Upload photos or documents to verify your eco-actions. Our AI will help validate your submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select active challenge" />
              </SelectTrigger>
              <SelectContent>
                {challenges
                  .filter((c) => c.joined || c.status === "active")
                  .map((challenge) => (
                    <SelectItem key={challenge.id} value={challenge.id.toString()}>
                      {challenge.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Drag and drop your proof image here, or click to browse</p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>

            <Textarea placeholder="Add a description of your eco-action (optional)" className="resize-none" />

            <Button className="w-full bg-green-600 hover:bg-green-700">Submit for Verification</Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Verification Dialog */}
      {showVerification && selectedChallenge && (
        <Dialog open={showVerification} onOpenChange={setShowVerification}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>AI Verification: {selectedChallenge.title}</DialogTitle>
              <DialogDescription>
                Upload proof of your eco-action for AI verification and earn {selectedChallenge.points} EcoPoints.
              </DialogDescription>
            </DialogHeader>
            <AIVerification
              challengeType={selectedChallenge.type}
              onVerificationComplete={handleVerificationComplete}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Upcoming Eco Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span>Upcoming Eco Events</span>
          </CardTitle>
          <CardDescription>Join local events to make a bigger impact together</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: "Community Tree Plantation Drive",
                date: "Dec 15, 2024",
                location: "Central Park, Delhi",
                organizer: "Green Delhi Initiative",
                participants: 45,
              },
              {
                title: "Plastic-Free Workshop",
                date: "Dec 18, 2024",
                location: "Online Event",
                organizer: "Zero Waste India",
                participants: 128,
              },
            ].map((event, index) => (
              <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-green-800">{event.title}</h4>
                    <p className="text-sm text-green-600">by {event.organizer}</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {event.participants} joined
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-green-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Join Event
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
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

const MotionCard = motion(Card)
const MotionDiv = motion.div
const MotionButton = motion(Button)

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
    
    if (result.success) {
    
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
      const updatedChallenges = challenges.map((challenge) =>
        challenge.id === selectedChallenge.id
          ? { ...challenge, joined: true, participants: challenge.participants + 1 }
          : challenge,
      )

      setChallenges(updatedChallenges)

      setJoinDialogOpen(false)

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3
      }
    }
  }

  const headerVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  const badgeVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        delay: 0.2
      }
    }
  }

  const buttonVariants: Variants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  }

  const eventVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4
      }
    },
    hover: {
      x: 4,
      transition: {
        duration: 0.2
      }
    }
  }

  return (
    <MotionDiv 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <MotionDiv 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
        variants={headerVariants}
      >
        <div>
          <motion.h2 
            className="text-2xl font-bold text-green-800"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Eco Challenges
          </motion.h2>
          <motion.p 
            className="text-green-600"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join challenges and make a positive impact
          </motion.p>
        </div>
        <MotionDiv 
          className="flex space-x-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
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
        </MotionDiv>
      </MotionDiv>

      {/* Challenge Grid */}
      <MotionDiv 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        <AnimatePresence>
          {filteredChallenges.map((challenge, index) => (
            <MotionCard 
              key={challenge.id} 
              className="border-green-200 hover:shadow-lg transition-shadow"
              variants={cardVariants}
              whileHover="hover"
              layout
              layoutId={`challenge-${challenge.id}`}
            >
              <CardHeader>
                <MotionDiv 
                  className="flex justify-between items-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div variants={badgeVariants}>
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
                  </motion.div>
                  <motion.div variants={badgeVariants}>
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
                  </motion.div>
                </MotionDiv>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CardTitle className="text-green-800">{challenge.title}</CardTitle>
                  <CardDescription>{challenge.description}</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent>
                <MotionDiv 
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Reward</span>
                    <motion.span 
                      className="font-semibold text-green-600"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                    >
                      {challenge.points} EcoPoints
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Impact</span>
                    <motion.span 
                      className="font-semibold text-blue-600"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                    >
                      {challenge.impact}
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Participants</span>
                    <motion.span 
                      className="font-semibold"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                    >
                      {challenge.participants}
                    </motion.span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time Left</span>
                    <motion.span 
                      className="font-semibold text-orange-600"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7, type: "spring" }}
                    >
                      {challenge.timeLeft}
                    </motion.span>
                  </div>

                  <MotionButton
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    disabled={challenge.status === "completed" || challenge.joined}
                    onClick={() => openJoinDialog(challenge)}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {challenge.status === "completed"
                      ? "Completed"
                      : challenge.joined
                        ? "Already Joined"
                        : "Join Challenge"}
                  </MotionButton>
                </MotionDiv>
              </CardContent>
            </MotionCard>
          ))}
        </AnimatePresence>
      </MotionDiv>

      {/* Join Challenge Dialog */}
      <AnimatePresence>
        {joinDialogOpen && (
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogContent className="max-w-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle>Join {selectedChallenge?.title}</DialogTitle>
                  <DialogDescription>
                    Ready to take on this eco-challenge? You'll earn {selectedChallenge?.points} EcoPoints upon completion.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <motion.div 
                    className="p-4 bg-green-50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h4 className="font-semibold text-green-800 mb-2">Challenge Details:</h4>
                    <p className="text-sm text-green-700">{selectedChallenge?.description}</p>
                    <p className="text-sm text-green-600 mt-2">Expected Impact: {selectedChallenge?.impact}</p>
                  </motion.div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                      Cancel
                    </Button>
                    <MotionButton
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleJoinChallenge}
                      disabled={joiningChallenge}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      {joiningChallenge ? "Joining..." : "Accept Challenge"}
                    </MotionButton>
                  </DialogFooter>
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Proof Submission Section */}
      <MotionCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Camera className="h-5 w-5 text-green-600" />
            </motion.div>
            <span>Submit Challenge Proof</span>
          </CardTitle>
          <CardDescription>
            Upload photos or documents to verify your eco-actions. Our AI will help validate your submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MotionDiv 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
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

            <motion.div 
              className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center"
              whileHover={{ 
                borderColor: "#22c55e",
                backgroundColor: "#f0fdf4",
                transition: { duration: 0.2 }
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Upload className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Drag and drop your proof image here, or click to browse</p>
                <MotionButton 
                  variant="outline" 
                  size="sm"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Choose File
                </MotionButton>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Textarea placeholder="Add a description of your eco-action (optional)" className="resize-none" />
            </motion.div>

            <MotionButton 
              className="w-full bg-green-600 hover:bg-green-700"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              Submit for Verification
            </MotionButton>
          </MotionDiv>
        </CardContent>
      </MotionCard>

      {/* AI Verification Dialog */}
      <AnimatePresence>
        {showVerification && selectedChallenge && (
          <Dialog open={showVerification} onOpenChange={setShowVerification}>
            <DialogContent className="max-w-3xl">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
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
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Upcoming Eco Events */}
      <MotionCard
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6, type: "spring" }}
            >
              <Calendar className="h-5 w-5 text-green-600" />
            </motion.div>
            <span>Upcoming Eco Events</span>
          </CardTitle>
          <CardDescription>Join local events to make a bigger impact together</CardDescription>
        </CardHeader>
        <CardContent>
          <MotionDiv 
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
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
              <motion.div 
                key={index} 
                className="border border-green-200 rounded-lg p-4 bg-green-50"
                variants={eventVariants}
                whileHover="hover"
              >
                <MotionDiv 
                  className="flex justify-between items-start mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div>
                    <h4 className="font-semibold text-green-800">{event.title}</h4>
                    <p className="text-sm text-green-600">by {event.organizer}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  >
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {event.participants} joined
                    </Badge>
                  </motion.div>
                </MotionDiv>
                <MotionDiv 
                  className="flex items-center space-x-4 text-sm text-green-600 mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </MotionDiv>
                <MotionButton 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  Join Event
                </MotionButton>
              </motion.div>
            ))}
          </MotionDiv>
        </CardContent>
      </MotionCard>
    </MotionDiv>
  )
}
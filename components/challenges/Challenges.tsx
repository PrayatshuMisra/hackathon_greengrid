"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AIVerification } from "@/components/ai/AIVerification"
import { useApp } from "@/app/providers"
import { useToast } from "@/hooks/use-toast"
import { Target, Upload, Users, Clock, Award, TrendingUp, Leaf, Zap, Droplets, Recycle } from "lucide-react"
import { 
  getAvailableChallenges, 
  enrollUserInChallenge, 
  checkUserEnrollment,
  getUserChallenges 
} from "@/lib/supabase"

const MotionCard = motion(Card)
const MotionButton = motion(Button)
const MotionDiv = motion.div

export function Challenges() {
  const { toast } = useToast()
  const { user, supabase } = useApp()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("active")
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null)
  const [showVerification, setShowVerification] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [joiningChallenge, setJoiningChallenge] = useState(false)
  const [challenges, setChallenges] = useState<any[]>([])
  const [userChallenges, setUserChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        
        // Fetch available challenges
        const { data: challengesData, error: challengesError } = await getAvailableChallenges()
        if (challengesError) {
          console.error("Error fetching challenges:", challengesError)
        } else {
          setChallenges(challengesData || [])
        }

        // Fetch user's enrolled challenges
        const { data: userChallengesData, error: userChallengesError } = await getUserChallenges(user.id)
        if (userChallengesError) {
          console.error("Error fetching user challenges:", userChallengesError)
        } else {
          setUserChallenges(userChallengesData || [])
        }
      } catch (error) {
        console.error("Error fetching challenges:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [user?.id])

  const filteredChallenges = challenges.filter((challenge) => {
    if (selectedCategory !== "all" && challenge.challenge_category?.name?.toLowerCase() !== selectedCategory) return false
    if (selectedStatus !== "all") {
      const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id)
      if (selectedStatus === "active" && (!userChallenge || userChallenge.status !== "active")) return false
      if (selectedStatus === "completed" && (!userChallenge || userChallenge.status !== "completed")) return false
    }
    return true
  })

  const isUserEnrolled = (challengeId: string) => {
    return userChallenges.some(uc => uc.challenge_id === challengeId)
  }

  const getUserChallengeStatus = (challengeId: string) => {
    const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId)
    return userChallenge?.status || null
  }

  const getUserChallengeProgress = (challengeId: string) => {
    const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId)
    return userChallenge?.progress || 0
  }

  const handleVerificationComplete = (result: any) => {
    console.log("Verification result:", result)
    
    if (result.success) {
      toast({
        title: "Verification Successful!",
        description: "Your challenge proof has been verified.",
        variant: "success",
      })
      setShowVerification(false)
    } else {
      toast({
        title: "Verification Failed",
        description: result.message || "Your submission could not be verified.",
        variant: "destructive",
      })
    }
  }

  const openJoinDialog = (challenge: any) => {
    setSelectedChallenge(challenge)
    setJoinDialogOpen(true)
  }

  const handleJoinChallenge = async () => {
    if (!selectedChallenge || !user?.id) return

    setJoiningChallenge(true)

    try {
      // Check if user is already enrolled
      const { enrolled } = await checkUserEnrollment(user.id, selectedChallenge.id)
      
      if (enrolled) {
        toast({
          title: "Already Enrolled",
          description: "You are already enrolled in this challenge.",
          variant: "default",
        })
        setJoinDialogOpen(false)
        return
      }

      // Enroll user in challenge
      const { success, error } = await enrollUserInChallenge(user.id, selectedChallenge.id)
      
      if (!success) {
        throw error
      }

      // Update local state
      const newUserChallenge = {
        id: success.data.id,
        user_id: user.id,
        challenge_id: selectedChallenge.id,
        status: 'active',
        progress: 0,
        points_earned: 0,
        started_at: new Date().toISOString(),
        challenge: selectedChallenge
      }
      
      setUserChallenges(prev => [...prev, newUserChallenge])

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
        description: error.message || "Failed to join challenge. Please try again.",
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

  const buttonVariants: Variants = {
    hover: { 
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: any } = {
      'Energy': Zap,
      'Transportation': Users,
      'Waste Reduction': Recycle,
      'Water': Droplets,
      'Food': Leaf,
      'Air Quality': TrendingUp
    }
    return iconMap[categoryName] || Target
  }

  const getDifficultyColor = (difficulty: string) => {
    const colorMap: { [key: string]: string } = {
      'Easy': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'Hard': 'bg-red-100 text-red-800'
    }
    return colorMap[difficulty] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <MotionDiv
        className="text-center space-y-4"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-green-800">
            Environmental Challenges
          </h1>
          <p className="text-lg text-green-600 max-w-2xl mx-auto">
            Join challenges to make a positive impact on the environment and earn EcoPoints
          </p>
        </div>

        {/* Filters */}
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
            </SelectContent>
          </Select>
        </MotionDiv>
      </MotionDiv>

      {/* Challenge Grid */}
      <MotionDiv
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredChallenges.map((challenge) => {
            const CategoryIcon = getCategoryIcon(challenge.challenge_category?.name)
            const isEnrolled = isUserEnrolled(challenge.id)
            const userStatus = getUserChallengeStatus(challenge.id)
            const userProgress = getUserChallengeProgress(challenge.id)
            
            return (
              <MotionCard
                key={challenge.id}
                className="group cursor-pointer border-2 hover:border-green-300 transition-all duration-300"
                variants={cardVariants}
                whileHover="hover"
                layout
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                        >
                          {challenge.challenge_category?.name || "Uncategorized"}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {challenge.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {challenge.description}
                  </CardDescription>
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
                      <span className="text-sm text-gray-600">Duration</span>
                      <motion.span 
                        className="font-semibold text-blue-600"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring" }}
                      >
                        {challenge.duration_days} days
                      </motion.span>
                    </div>

                    {isEnrolled && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{userProgress}%</span>
                        </div>
                        <Progress value={userProgress} className="h-2" />
                      </div>
                    )}

                    <MotionButton
                      className="w-full mt-4"
                      disabled={userStatus === "completed"}
                      onClick={() => {
                        if (isEnrolled && userStatus === "active") {
                          handleSubmitProof(challenge)
                        } else if (!isEnrolled) {
                          openJoinDialog(challenge)
                        }
                      }}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      {userStatus === "completed"
                        ? "Completed"
                        : isEnrolled
                          ? "Submit Proof"
                          : "Join Challenge"}
                    </MotionButton>
                  </MotionDiv>
                </CardContent>
              </MotionCard>
            )
          })}
        </AnimatePresence>
      </MotionDiv>

      {/* Join Challenge Dialog */}
      <AnimatePresence>
        {joinDialogOpen && selectedChallenge && (
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Join Challenge</span>
                  </DialogTitle>
                  <DialogDescription>
                    Are you ready to make a difference? Join this challenge and start earning EcoPoints.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      {selectedChallenge.title}
                    </h4>
                    <p className="text-sm text-green-600 mb-3">
                      {selectedChallenge.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Reward:</span>
                        <div className="font-semibold text-green-600">
                          {selectedChallenge.points} EcoPoints
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <div className="font-semibold text-blue-600">
                          {selectedChallenge.duration_days} days
                        </div>
                      </div>
                    </div>
                  </div>
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
                  challengeType={selectedChallenge.challenge_type}
                  onVerificationComplete={handleVerificationComplete}
                />
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
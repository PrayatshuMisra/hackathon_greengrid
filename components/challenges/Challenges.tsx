"use client"

import { useState, useEffect } from "react"
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
import { toast } from "react-hot-toast";


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
  const [challenges, setChallenges] = useState<any[]>([])
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([])
  const [participantsMap, setParticipantsMap] = useState<{ [challengeId: string]: number }>({})

  useEffect(() => {
    const fetchChallenges = async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, challenge_categories(name)");
      if (!error && Array.isArray(data)) {
        setChallenges(data);
      }
    };
    fetchChallenges();
  }, [supabase]);

  useEffect(() => {
    const fetchJoined = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("user_challenges")
        .select("challenge_id")
        .eq("user_id", user.id)
        .in("status", ["active", "in_progress", "pending_verification", "completed"]);
      if (!error && Array.isArray(data)) {
        setJoinedChallengeIds(data.map((row) => row.challenge_id));
      }
    };
    fetchJoined();
  }, [user?.id, supabase]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!challenges.length) return;
      const challengeIds = challenges.map((c) => c.id)
      const { data, error } = await supabase
        .from("user_challenges")
        .select("challenge_id")
        .in("challenge_id", challengeIds)
      if (!error && Array.isArray(data)) {
        const countMap: { [challengeId: string]: number } = {}
        data.forEach((row) => {
          countMap[row.challenge_id] = (countMap[row.challenge_id] || 0) + 1
        })
        setParticipantsMap(countMap)
      }
    }
    fetchParticipants()
  }, [challenges, supabase])

  const filteredChallenges = challenges.filter((challenge) => {

    const categoryName = challenge.challenge_categories?.name?.toLowerCase() || "";
    if (selectedCategory !== "all" && categoryName !== selectedCategory) return false;
 
    if (selectedStatus === "active" && (!challenge.is_active || (challenge.end_date && new Date(challenge.end_date) < new Date()))) return false;
    if (selectedStatus === "completed") return false;
    return true;
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
    if (!selectedChallenge || !user?.id) return

    setJoiningChallenge(true)

    try {
  
      console.log('user.id:', user.id, 'selectedChallenge.id:', selectedChallenge.id);
 
      const { data, error } = await supabase
        .from("user_challenges")
        .upsert([
          {
            user_id: user.id,
            challenge_id: selectedChallenge.id,
            status: "active",
            progress: 0,
          }
        ], { onConflict: ['user_id', 'challenge_id'] });
  
      console.log('Upsert response:', { data, error });

      if (error) throw error;

      await supabase.from("user_activity").insert([
        {
          user_id: user.id,
          activity_type: "challenge",
          description: `Joined the challenge: ${selectedChallenge.title}`,
          points_earned: 0,
          related_id: selectedChallenge.id,
          related_type: "challenge"
        }
      ]);

      setJoinDialogOpen(false)

      setJoinedChallengeIds((prev) => [...prev, selectedChallenge.id])

      toast({
        title: "Thank you for joining!",
        description: `You've successfully joined the ${selectedChallenge.title}`,
        variant: "success",
      })

    } catch (error) {
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
                        challenge.challenge_categories?.name === "Energy"
                          ? "bg-yellow-100 text-yellow-800"
                          : challenge.challenge_categories?.name === "Transportation"
                            ? "bg-blue-100 text-blue-800"
                            : challenge.challenge_categories?.name === "Water"
                              ? "bg-cyan-100 text-cyan-800"
                              : challenge.challenge_categories?.name === "Food"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                      }`}
                    >
                      {challenge.challenge_categories?.name}
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
                      {challenge.impact || '-'}
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
                      {participantsMap[challenge.id] || 0}
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
                      {challenge.end_date ? `${Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days` : '-'}
                    </motion.span>
                  </div>

                  <MotionButton
                    className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    disabled={joinedChallengeIds.includes(challenge.id) || !challenge.is_active || (challenge.end_date && new Date(challenge.end_date) < new Date())}
                    onClick={() => openJoinDialog(challenge)}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    {joinedChallengeIds.includes(challenge.id)
                      ? "Already Joined"
                      : (challenge.is_active ? "Join Challenge" : "Completed")}
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
                  .filter((c) => c.is_active)
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
          date: "July 15, 2025",
          location: "Central Park, Delhi",
          organizer: "Green Delhi Initiative",
          participants: 45,
        },
        {
          title: "Plastic-Free Workshop",
          date: "July 18, 2025",
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
            onClick={() =>
            toast({
            title: "Coming Soon!",
            description: "Stay tuned for event participation.",
            className: "bg-green-50 text-green-800 border border-green-200 shadow-md rounded-lg p-4",
            })
            }
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
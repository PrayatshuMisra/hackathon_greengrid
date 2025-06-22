"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useApp } from "@/app/providers";
import { useRealtime } from "@/lib/realtime";
import {
  Zap,
  Droplets,
  Recycle,
  TreePine,
  Target,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  Trophy,
  Sprout,
} from "lucide-react";
import { AIVerification } from "@/components/ai/AIVerification";
import { DialogDescription } from "@radix-ui/react-dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogContent } from "@radix-ui/react-dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  getUserChallenges,
  updateChallengeProgress,
  getUserBadges,
  awardBadgeToUser,
} from "@/lib/supabase";

export function Dashboard() {
  const { user, supabase } = useApp();
  const { teams, notifications } = useRealtime();
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    rank: 0,
    challengesCompleted: 0,
    co2Saved: 0,
    waterSaved: 0,
    plasticAvoided: 0,
    treesPlanted: 0,
    weeklyProgress: 0,
    level: 1,
    levelTitle: "Eco Beginner",
  });
  const [loading, setLoading] = useState(true);
  const [submitProofOpen, setSubmitProofOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Fetch user stats
        const { data: statsData, error: statsError } = await supabase
          .from("user_dashboard_stats")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (statsError && statsError.code !== "PGRST116") {
          throw statsError;
        }

        if (statsData) {
          setUserStats({
            totalPoints: statsData.total_points || 0,
            rank: statsData.rank || 0,
            challengesCompleted: statsData.challenges_completed || 0,
            co2Saved: statsData.co2_saved || 0,
            waterSaved: statsData.water_saved || 0,
            plasticAvoided: statsData.plastic_avoided || 0,
            treesPlanted: statsData.trees_planted || 0,
            weeklyProgress: 75,
            level: statsData.level || 1,
            levelTitle: getLevelTitle(statsData.level || 1),
          });
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_points, level, rank")
            .eq("id", user.id)
            .single();

          if (profile) {
            setUserStats({
              ...userStats,
              totalPoints: profile.total_points || 0,
              level: profile.level || 1,
              rank: profile.rank || 0,
              levelTitle: getLevelTitle(profile.level || 1),
            });
          }
        }

        // Fetch user challenges
        const { data: challengesData, error: challengesError } = await getUserChallenges(user.id);
        if (challengesError) {
          console.error("Error fetching user challenges:", challengesError);
        } else {
          setActiveChallenges(challengesData || []);
        }

        // Fetch user badges
        const { data: badgesData, error: badgesError } = await getUserBadges(user.id);
        if (badgesError) {
          console.error("Error fetching user badges:", badgesError);
        } else {
          setUserBadges(badgesData || []);
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id, supabase]);

  const getLevelTitle = (level: number) => {
    const titles = [
      "Eco Beginner",
      "Green Novice",
      "Sustainability Enthusiast",
      "Eco Warrior",
      "Climate Champion",
      "Environmental Hero",
      "Planet Protector",
      "Earth Guardian",
      "Eco Legend",
      "Climate Savior",
    ];
    return titles[Math.min(level - 1, titles.length - 1)];
  };

  const recentActivity = [
    {
      action: "Completed Plastic-Free Day 4",
      points: 25,
      time: "2 hours ago",
      type: "challenge",
    },
    {
      action: "Joined Bike Commute Challenge",
      points: 0,
      time: "1 day ago",
      type: "join",
    },
    {
      action: "Earned Energy Saver Badge",
      points: 100,
      time: "3 days ago",
      type: "badge",
    },
    {
      action: "Planted tree in community drive",
      points: 50,
      time: "1 week ago",
      type: "event",
    },
  ];

  const handleSubmitProof = (challenge: any) => {
    setSelectedChallenge(challenge);
    setSubmitProofOpen(true);
    toast({
      title: "Scroll Down",
      description: "Scroll down to the bottom of the page to verify your submission",
      variant: "success",
      duration: 5000,
      className: "max-w-[90vw] mx-4",
    });
  };

  const handleVerificationComplete = async (result: any) => {
    if (result.success && selectedChallenge) {
      try {
        // Calculate new progress (increment by 20% for each verification)
        const currentProgress = selectedChallenge.progress || 0;
        const newProgress = Math.min(100, currentProgress + 20);
        
        // Update challenge progress in database
        const { success: updateSuccess, error: updateError } = await updateChallengeProgress(
          selectedChallenge.id,
          newProgress,
          newProgress >= 100 ? selectedChallenge.challenge?.points || 0 : 0
        );

        if (!updateSuccess) {
          throw updateError;
        }

        // Update local state
        const updatedChallenges = activeChallenges.map((challenge) =>
          challenge.id === selectedChallenge.id
            ? { ...challenge, progress: newProgress }
            : challenge
        );

        setActiveChallenges(updatedChallenges);

        if (newProgress >= 100) {
          // Challenge completed - award badge if applicable
          const challengeType = selectedChallenge.challenge?.challenge_type;
          if (challengeType) {
            // Map challenge types to badge IDs (you'll need to adjust these based on your badge IDs)
            const badgeMap: { [key: string]: string } = {
              'plastic-free': 'plastic-free-warrior-badge-id',
              'bike-commute': 'green-commuter-badge-id',
              'energy-bill': 'energy-saver-badge-id',
              'composting': 'compost-champion-badge-id',
              'plant-growing': 'tree-planter-badge-id',
              'water-bill': 'water-guardian-badge-id'
            };

            const badgeId = badgeMap[challengeType];
            if (badgeId && user?.id) {
              await awardBadgeToUser(user.id, badgeId, selectedChallenge.challenge?.id);
            }
          }

          toast({
            title: "Challenge Completed!",
            description: `You've earned ${selectedChallenge.challenge?.points || 0} EcoPoints! 🎉`,
            variant: "success",
          });

          // Redirect to certificate page
          router.push(
            `/certificate?challenge=${encodeURIComponent(
              selectedChallenge.challenge?.title || "Unknown Challenge"
            )}&points=${selectedChallenge.challenge?.points || 0}`
          );
        } else {
          toast({
            title: "Verification Successful!",
            description:
              "Your challenge proof has been verified and your progress has been updated.",
            variant: "success",
          });
        }

        setSubmitProofOpen(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to process verification",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Verification Failed",
        description:
          result.message ||
          "Your submission could not be verified. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your eco-journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                Welcome back, {user?.name || "Eco Warrior"}! 🌱
              </h1>
              <p className="text-green-600">
                Level {userStats.level} • {userStats.levelTitle}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {userStats.totalPoints}
              </div>
              <div className="text-sm text-green-500">Total EcoPoints</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-800">
                  {userStats.co2Saved}kg
                </div>
                <div className="text-xs text-blue-600">CO₂ Saved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Droplets className="h-5 w-5 text-cyan-600" />
              <div>
                <div className="text-2xl font-bold text-cyan-800">
                  {userStats.waterSaved}L
                </div>
                <div className="text-xs text-cyan-600">Water Saved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Recycle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-800">
                  {userStats.plasticAvoided}kg
                </div>
                <div className="text-xs text-green-600">Plastic Avoided</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Sprout className="h-5 w-5 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-emerald-800">
                  {userStats.treesPlanted}
                </div>
                <div className="text-xs text-emerald-600">Trees Planted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Challenges */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Your Active Challenges</span>
              </CardTitle>
              <CardDescription>
                Keep up the momentum! Complete these challenges to earn more
                EcoPoints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeChallenges.length > 0 ? (
                activeChallenges
                  .filter(challenge => challenge.status === 'active')
                  .map((challenge) => (
                    <Card
                      key={challenge.id}
                      className="border-green-200 bg-green-50 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-green-800 mb-1">
                              {challenge.challenge?.title}
                            </h4>
                            <p className="text-sm text-green-600 mb-2">
                              {challenge.challenge?.description}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-green-700">Progress</span>
                                <span className="font-medium text-green-800">
                                  {challenge.progress || 0}%
                                </span>
                              </div>
                              <Progress
                                value={challenge.progress || 0}
                                className="h-2"
                              />
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className="bg-green-200 text-green-800 ml-4"
                          >
                            {challenge.challenge?.points || 0} pts
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-green-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{challenge.challenge?.duration_days || 7} days left</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSubmitProof(challenge)}
                          >
                            Submit Proof
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-600 mb-1">
                    No active challenges yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Join challenges to start making an impact!
                  </p>
                  <Button
                    onClick={() => router.push("/challenges")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Browse Challenges
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === "challenge"
                          ? "bg-green-100"
                          : activity.type === "badge"
                          ? "bg-yellow-100"
                          : activity.type === "event"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {activity.type === "challenge" && (
                        <Target className="h-4 w-4 text-green-600" />
                      )}
                      {activity.type === "badge" && (
                        <Award className="h-4 w-4 text-yellow-600" />
                      )}
                      {activity.type === "event" && (
                        <TreePine className="h-4 w-4 text-blue-600" />
                      )}
                      {activity.type === "join" && (
                        <Users className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.points > 0 && (
                      <div className="text-sm font-semibold text-green-600">
                        +{activity.points}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Badges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span>Your Badges</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userBadges.length > 0 ? (
                  userBadges.slice(0, 5).map((userBadge) => (
                    <div
                      key={userBadge.id}
                      className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-50 border border-yellow-200"
                    >
                      <div className="text-2xl">{userBadge.badge?.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">
                          {userBadge.badge?.name}
                        </p>
                        <p className="text-xs text-yellow-600">
                          {userBadge.badge?.rarity}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No badges earned yet</p>
                    <p className="text-xs text-gray-400">Complete challenges to earn badges!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Weekly Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Eco Actions</span>
                    <span>{userStats.weeklyProgress}%</span>
                  </div>
                  <Progress value={userStats.weeklyProgress} className="h-2" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats.challengesCompleted}
                  </div>
                  <div className="text-sm text-gray-600">Challenges Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Proof Dialog */}
      <Dialog open={submitProofOpen} onOpenChange={setSubmitProofOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Submit Challenge Proof</DialogTitle>
            <DialogDescription>
              Upload proof of your eco-action for verification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedChallenge && (
              <AIVerification
                challengeType={selectedChallenge.challenge?.challenge_type}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

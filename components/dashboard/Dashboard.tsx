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
} from "lucide-react";
import { AIVerification } from "@/components/ai/AIVerification";
import { DialogDescription } from "@radix-ui/react-dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogContent } from "@radix-ui/react-dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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
  const { toast } = useToast();
  const router = useRouter();

  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("user_dashboard_stats")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          setUserStats({
            totalPoints: data.total_points || 0,
            rank: data.rank || 0,
            challengesCompleted: data.challenges_completed || 0,
            co2Saved: data.co2_saved || 0,
            waterSaved: data.water_saved || 0,
            plasticAvoided: data.plastic_avoided || 0,
            treesPlanted: data.trees_planted || 0,
            weeklyProgress: 75,
            level: data.level || 1,
            levelTitle: getLevelTitle(data.level || 1),
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
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveChallenges = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("user_challenges")
        .select("*, challenges(id, title, description, category_id, points, difficulty, challenge_type, duration_days, max_participants, verification_required, auto_verify, start_date, end_date, is_active, created_by, created_at, updated_at)")
        .eq("user_id", user.id)
        .in("status", ["active", "in_progress"])
        .order("started_at", { ascending: false });
      console.log('Fetched active challenges:', data, error);
      if (!error && Array.isArray(data)) {
        setActiveChallenges(data);
      }
    };

    const fetchBadges = async () => {
      if (!user?.id) return;
      // Fetch badges earned by the user
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badges(name, icon, rarity)")
        .eq("user_id", user.id);
      if (!error && Array.isArray(data)) {
        setBadges(data);
      }
    };

    const fetchTeamInfo = async () => {
      if (!user?.team_id) return;
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", user.team_id)
        .single();
      if (!error && data) {
        setTeamInfo(data);
      }
    };

    const fetchRecentActivity = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        setRecentActivity(data);
      }
    };

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

    fetchUserStats();
    fetchActiveChallenges();
    fetchBadges();
    fetchTeamInfo();
    fetchRecentActivity();
    fetchJoined();

    // Real-time subscription for user_challenges
    const channel = supabase
      .channel('user_challenges_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_challenges', filter: `user_id=eq.${user?.id}` },
        () => fetchActiveChallenges()
      )
      .subscribe();

    // Real-time subscription for user_activity
    const activityChannel = supabase
      .channel('user_activity_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_activity', filter: `user_id=eq.${user?.id}` },
        () => fetchRecentActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(activityChannel);
    };
  }, [user?.id, user?.team_id, supabase]);

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
        const currentProgress = selectedChallenge.progress || 0;
        const newProgress = Math.min(100, currentProgress + 20); // Assuming 20% progress per verification
        const challengePoints = selectedChallenge.challenges?.points || 0;

        if (newProgress >= 100) {
          // --- CHALLENGE COMPLETED ---
          
          // 1. Final update to user_challenges
          await supabase
            .from("user_challenges")
            .update({
              progress: 100,
              status: "completed",
              completed_at: new Date().toISOString(),
              points_earned: challengePoints,
            })
            .eq("id", selectedChallenge.id);

          // 2. Call DB function to update user and team points
          if (user?.id && challengePoints > 0) {
            const { error: pointsError } = await supabase.rpc(
              "update_user_points",
              {
                user_id: user.id,
                points_to_add: challengePoints,
              }
            );
            if (pointsError) throw pointsError;
          }

          // 3. Log completion activity
          if (user?.id) {
            await supabase.from("user_activity").insert({
              user_id: user.id,
              activity_type: "challenge",
              description: `Completed: "${selectedChallenge.challenges?.title}" & earned ${challengePoints} points!`,
              points_earned: challengePoints,
              related_id: selectedChallenge.challenges?.id,
              related_type: "challenge",
            });
          }

          // 4. Show toast and redirect
          toast({
            title: "Challenge Completed!",
            description: `You've earned ${challengePoints} EcoPoints! 🎉`,
            variant: "success",
          });
          
          router.push(
            `/certificate?challenge=${encodeURIComponent(
              selectedChallenge.challenges?.title || ""
            )}&points=${challengePoints}`
          );

        } else {
          // --- CHALLENGE IN PROGRESS ---

          // 1. Update progress in user_challenges
          const { data, error } = await supabase
            .from("user_challenges")
            .update({ progress: newProgress })
            .eq("id", selectedChallenge.id)
            .select()
            .single();

          if (error) throw error;
          
          // 2. Update local state for active challenges
          if (data) {
            setActiveChallenges((prev) =>
              prev.map((challenge) =>
                challenge.id === selectedChallenge.id
                  ? { ...challenge, progress: data.progress }
                  : challenge
              )
            );
          }
          
          // 3. Log progress activity
          if (user?.id) {
            await supabase.from("user_activity").insert({
              user_id: user.id,
              activity_type: "challenge",
              description: `Proof verified for: "${selectedChallenge.challenges?.title}"`,
              related_id: selectedChallenge.challenges?.id,
              related_type: "challenge",
            });
          }

          // 4. Show progress toast
          toast({
            title: "Verification Successful!",
            description: "Your challenge proof has been verified and your progress has been updated.",
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-green-800">
                Welcome back, {user?.name?.split(" ")[0] || "User"}! 🌱
              </h2>
              <p className="text-green-600">
                You're making a real difference for our planet
              </p>
              <div className="flex items-center space-x-4">
                <Badge className="bg-green-200 text-green-800 hover:bg-green-200">
                  Level {userStats.level} - {userStats.levelTitle}
                </Badge>
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <Users className="h-4 w-4" />
                  <span>Rank #{userStats.rank || "N/A"} globally</span>
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-4xl font-bold text-green-700">
                {userStats.totalPoints}
              </div>
              <div className="text-sm text-green-600">EcoPoints</div>
              <div className="w-32">
                <Progress value={userStats.weeklyProgress} className="h-2" />
                <div className="text-xs text-green-500 mt-1">
                  Weekly Goal: {userStats.weeklyProgress}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-200 rounded-full">
                <Zap className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">CO₂ Saved</p>
                <p className="text-2xl font-bold text-green-800">
                  {userStats.co2Saved}kg
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12% this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-200 rounded-full">
                <Droplets className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Water Saved</p>
                <p className="text-2xl font-bold text-blue-800">
                  {userStats.waterSaved}L
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-blue-500">+8% this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-200 rounded-full">
                <Recycle className="h-6 w-6 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">
                  Plastic Avoided
                </p>
                <p className="text-2xl font-bold text-orange-800">
                  {userStats.plasticAvoided}kg
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500">
                    +15% this week
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-200 rounded-full">
                <TreePine className="h-6 w-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm text-emerald-600 font-medium">
                  Trees Planted
                </p>
                <p className="text-2xl font-bold text-emerald-800">
                  {userStats.treesPlanted}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+1 this week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                activeChallenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className="border-green-200 bg-green-50 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-800 mb-1">
                            {challenge.challenges?.title}
                          </h4>
                          <p className="text-sm text-green-600 mb-2">
                            {challenge.challenges?.description}
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
                          {challenge.challenges?.points} pts
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-green-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{challenge.challenges?.end_date ? `${Math.ceil((new Date(challenge.challenges.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left` : "-"}</span>
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
                        activity.activity_type === "challenge"
                          ? "bg-green-100"
                          : activity.activity_type === "badge"
                          ? "bg-yellow-100"
                          : activity.activity_type === "event"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {activity.activity_type === "challenge" && (
                        <Target className="h-4 w-4 text-green-600" />
                      )}
                      {activity.activity_type === "badge" && (
                        <Award className="h-4 w-4 text-yellow-600" />
                      )}
                      {activity.activity_type === "event" && (
                        <TreePine className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                    {activity.points_earned > 0 && (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-300"
                      >
                        +{activity.points_earned} pts
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Badges Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Your Badges</span>
              </CardTitle>
              <CardDescription>
                Collect badges by completing challenges and eco-actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {badges.length > 0 ? badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`relative text-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      badge.earned
                        ? "border-yellow-300 bg-yellow-50 shadow-md hover:shadow-lg"
                        : "border-gray-200 bg-gray-50 opacity-50 hover:opacity-75"
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.badges?.icon}</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {badge.badges?.name}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        badge.badges?.rarity === "Legendary"
                          ? "border-purple-300 text-purple-600"
                          : badge.badges?.rarity === "Epic"
                          ? "border-orange-300 text-orange-600"
                          : badge.badges?.rarity === "Rare"
                          ? "border-blue-300 text-blue-600"
                          : "border-gray-300 text-gray-600"
                      }`}
                    >
                      {badge.badges?.rarity}
                    </Badge>
                    {badge.earned && (
                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-600 bg-white rounded-full" />
                    )}
                  </div>
                )) : <div className="col-span-3 text-center text-gray-400">No badges earned yet</div>}
              </div>
            </CardContent>
          </Card>

          {/* Team Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamInfo ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Team Name</span>
                      <span className="font-medium">{teamInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rank</span>
                      <Badge className="bg-yellow-100 text-yellow-800">#{teamInfo.rank}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Members</span>
                      <span className="font-medium">{teamInfo.member_count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Points</span>
                      <span className="font-bold text-green-600">{teamInfo.total_points}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => router.push("/teams")}
                    >
                      View Team Details
                    </Button>
                  </>
                ) : <div className="text-center text-gray-400">No team joined yet</div>}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickActions />
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
                challengeType={selectedChallenge.challenges?.challenge_type || ""}
                onVerificationComplete={handleVerificationComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

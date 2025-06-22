"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Award, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  TreePine,
  Coins,
  Target,
  Calendar,
  MapPin,
  Activity,
  Download,
  RefreshCw,
  Shield,
  MessageCircle,
  Gift
} from "lucide-react"
import { useApp } from "@/app/providers"
import { useToast } from "@/hooks/use-toast"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
  Legend
} from "recharts"
import {
  DashboardStats,
  fetchStats,
  ChartData,
  UserSignup,
  ChallengeCompletion,
  PointsEarned,
  fetchUserSignups,
  fetchChallengeCompletions,
  fetchPointsEarned,
  fetchChallengeCategories,
  fetchUserLevels,
  fetchChallengeDifficulty,
  fetchPointsDistribution,
  fetchCityDistribution,
  fetchMonthlyRegistrations,
  fetchPostActivity,
  fetchForumActivity,
  fetchUserEngagement,
  fetchRewardRedemptions,
  fetchBadgeDistribution,
  fetchTopRewards,
  fetchTeamPerformance,
  fetchGrowthStats,
  GrowthStats,
  fetchCityDistributionAnalysis,
  fetchMonthlyRegistrationAnalysis,
  fetchRewardRedemptionOverTime,
  fetchPointsSpentPerReward,
  fetchUserRewardSegmentation,
  CityDistributionAnalysis,
  MonthlyRegistrationAnalysis,
  RewardRedemptionOverTime,
  PointsSpentPerReward,
  UserRewardSegmentation,
} from "@/lib/admin/dashboard"

export default function AdminDashboard() {
  const { supabase } = useApp()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTeams: 0,
    totalChallenges: 0,
    totalPoints: 0,
    totalEvents: 0,
    totalPosts: 0,
    totalRewards: 0,
    totalBadges: 0,
    totalReplies: 0,
    totalLikes: 0,
    totalRewardsRedeemed: 0,
    totalPointsRedeemed: 0,
  })
  const [growth, setGrowth] = useState<GrowthStats>({
    userGrowth: 0,
    teamGrowth: 0,
    postGrowth: 0,
    rewardGrowth: 0,
  })
  const [chartData, setChartData] = useState<Partial<ChartData>>({})
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [cityAnalysis, setCityAnalysis] = useState<CityDistributionAnalysis | null>(null)
  const [monthlyRegAnalysis, setMonthlyRegAnalysis] = useState<MonthlyRegistrationAnalysis | null>(null)
  const [rewardRedemptionOverTime, setRewardRedemptionOverTime] = useState<RewardRedemptionOverTime[]>([])
  const [pointsSpentPerReward, setPointsSpentPerReward] = useState<PointsSpentPerReward[]>([])
  const [userRewardSegmentation, setUserRewardSegmentation] = useState<UserRewardSegmentation | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsData, growthData] = await Promise.all([
        fetchStats(supabase),
        fetchGrowthStats(supabase)
      ])
      setStats(statsData)
      setGrowth(growthData)
      await Promise.all([
        fetchRecentActivity(),
        fetchChartData()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const [
        userSignups,
        challengeCompletions,
        pointsEarned,
        challengeCategories,
        userLevels,
        challengeDifficulty,
        pointsDistribution,
        cityAnalysisData,
        monthlyRegData,
        postActivity,
        forumActivity,
        userEngagement,
        rewardRedemptions,
        badgeDistribution,
        topRewards,
        teamPerformance,
        rewardRedemptionOverTimeData,
        pointsSpentPerRewardData,
        userRewardSegmentationData
      ] = await Promise.all([
        fetchUserSignups(supabase),
        fetchChallengeCompletions(supabase),
        fetchPointsEarned(supabase),
        fetchChallengeCategories(supabase),
        fetchUserLevels(supabase),
        fetchChallengeDifficulty(supabase),
        fetchPointsDistribution(supabase),
        fetchCityDistributionAnalysis(supabase),
        fetchMonthlyRegistrationAnalysis(supabase),
        fetchPostActivity(supabase),
        fetchForumActivity(supabase),
        fetchUserEngagement(supabase),
        fetchRewardRedemptions(supabase),
        fetchBadgeDistribution(supabase),
        fetchTopRewards(supabase),
        fetchTeamPerformance(supabase),
        fetchRewardRedemptionOverTime(supabase),
        fetchPointsSpentPerReward(supabase),
        fetchUserRewardSegmentation(supabase)
      ])
      setChartData({
        userSignups,
        challengeCompletions,
        pointsEarned,
        challengeCategories,
        userLevels,
        challengeDifficulty,
        pointsDistribution,
        postActivity,
        forumActivity,
        userEngagement,
        rewardRedemptions,
        badgeDistribution,
        topRewards,
        teamPerformance,
        cityDistribution: cityAnalysisData.topCities,
        monthlyRegistrations: monthlyRegData.months.map((month, i) => ({ month, registrations: monthlyRegData.registrations[i] })),
      })
      setCityAnalysis(cityAnalysisData)
      setMonthlyRegAnalysis(monthlyRegData)
      setRewardRedemptionOverTime(rewardRedemptionOverTimeData)
      setPointsSpentPerReward(pointsSpentPerRewardData)
      setUserRewardSegmentation(userRewardSegmentationData)
    } catch (error) {
      console.error("Error fetching chart data:", error)
      toast({
        title: "Error",
        description: "Failed to load chart data",
        variant: "destructive"
      })
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const { data } = await supabase
        .from("user_activity")
        .select(`
          *,
          profiles(name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      setRecentActivity(data || [])
    } catch (error) {
      console.error("Error fetching recent activity:", error)
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1']

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights for GreenGrid platform.</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {growth.userGrowth >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={growth.userGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(growth.userGrowth).toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {growth.teamGrowth >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={growth.teamGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(growth.teamGrowth).toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Platform-wide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChallenges.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available challenges
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {growth.postGrowth >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={growth.postGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(growth.postGrowth).toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRewards.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBadges.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total badges earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forum Activity</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReplies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Replies & {stats.totalLikes.toLocaleString()} likes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRewardsRedeemed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {growth.rewardGrowth >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
              )}
              <span className={growth.rewardGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(growth.rewardGrowth).toFixed(1)}%
              </span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPointsRedeemed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total points spent
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
          <TabsTrigger value="rewards">Rewards & Badges</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>User Signups (Last 7 Days)</CardTitle>
                <CardDescription>Daily user registration trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.userSignups}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="signups" fill="#10b981" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.profiles?.name || "Unknown User"} - {format(new Date(activity.created_at), "MMM dd, HH:mm")}
                      </p>
                      {activity.points_earned > 0 && (
                        <Badge variant="outline" className="text-xs mt-1">
                          +{activity.points_earned} pts
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Completions</CardTitle>
                <CardDescription>Daily challenge completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.challengeCompletions}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="completions" stroke="#3b82f6" strokeWidth={2} />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points Earned</CardTitle>
                <CardDescription>Daily points earned by users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.pointsEarned}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="points" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                    <Tooltip />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Categories</CardTitle>
                <CardDescription>Distribution of challenges by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.challengeCategories}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.challengeCategories?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Levels</CardTitle>
                <CardDescription>Distribution of users by level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.userLevels} layout="horizontal">
                    <XAxis type="number" />
                    <YAxis dataKey="level" type="category" width={80} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="count" fill="#ef4444" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Challenge Difficulty</CardTitle>
                <CardDescription>Challenges by difficulty level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.challengeDifficulty}
                      dataKey="count"
                      nameKey="difficulty"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.challengeDifficulty?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Points Distribution</CardTitle>
                <CardDescription>How points are distributed among users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.pointsDistribution}>
                    <XAxis dataKey="range" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="count" fill="#06b6d4" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>City Distribution (Top 10 + Others)</CardTitle>
                <CardDescription>User distribution by city (pie and bar)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cityAnalysis ? [...cityAnalysis.topCities, cityAnalysis.others > 0 ? { city: 'Others', count: cityAnalysis.others, percentage: ((cityAnalysis.others / cityAnalysis.total) * 100).toFixed(1) } : null].filter(Boolean) : []}
                      dataKey="count"
                      nameKey="city"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ city, percent }) => `${city} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(cityAnalysis ? [...cityAnalysis.topCities, cityAnalysis.others > 0 ? { city: 'Others', count: cityAnalysis.others, percentage: ((cityAnalysis.others / cityAnalysis.total) * 100).toFixed(1) } : null].filter(Boolean) : []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cityAnalysis ? cityAnalysis.topCities : []} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="city" type="category" width={120} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="count" fill="#8884d8" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Registrations</CardTitle>
                <CardDescription>Registrations and cumulative total</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRegAnalysis ? monthlyRegAnalysis.months.map((month, i) => ({ month, registrations: monthlyRegAnalysis.registrations[i], cumulative: monthlyRegAnalysis.cumulative[i] })) : []}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="registrations" stroke="#8884d8" />
                    <Line type="monotone" dataKey="cumulative" stroke="#10b981" />
                    <Tooltip />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Post Activity (Last 7 Days)</CardTitle>
              <CardDescription>Daily forum post trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.postActivity}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="posts" stroke="#8884d8" />
                  <Tooltip />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Forum Activity (Last 30 Days)</CardTitle>
                <CardDescription>Posts, replies, and likes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData.forumActivity}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.forumActivity?.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Most Active Users</CardTitle>
                <CardDescription>Users with the most activity in the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.userEngagement} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="user" type="category" width={100} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="activities" fill="#82ca9d" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Reward Redemptions Over Time</CardTitle>
                        <CardDescription>Monthly reward redemptions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={rewardRedemptionOverTime}>
                                <XAxis dataKey="period" />
                                <YAxis />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="redemptions" stroke="#8884d8" />
                                <Tooltip />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Points Spent Per Reward</CardTitle>
                        <CardDescription>Total points spent for each reward</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={pointsSpentPerReward} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="reward" type="category" width={120} />
                                <CartesianGrid strokeDasharray="3 3" />
                                <Bar dataKey="pointsSpent" fill="#ffc658" />
                                <Tooltip />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>User Reward Segmentation</CardTitle>
                    <CardDescription>Users who have redeemed at least one reward vs not</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={userRewardSegmentation ? [
                                  { name: 'Redeemed', value: userRewardSegmentation.redeemed },
                                  { name: 'Not Redeemed', value: userRewardSegmentation.notRedeemed }
                                ] : []}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {userRewardSegmentation ? [
                                  { name: 'Redeemed', value: userRewardSegmentation.redeemed },
                                  { name: 'Not Redeemed', value: userRewardSegmentation.notRedeemed }
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                )) : null}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Top 10 teams by total points</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.teamPerformance}>
                    <XAxis dataKey="team" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="points" fill="#ff7300" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Most active users in last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.userEngagement} layout="horizontal">
                    <XAxis type="number" />
                    <YAxis dataKey="user" type="category" width={100} />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="activities" fill="#f59e0b" key="user-engagement-performance" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Points Distribution</CardTitle>
                <CardDescription>How points are distributed among users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.pointsDistribution}>
                    <XAxis dataKey="range" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Bar dataKey="count" fill="#06b6d4" key="points-distribution-performance" />
                    <Tooltip />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

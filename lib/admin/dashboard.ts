import { SupabaseClient } from "@supabase/supabase-js";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

// Interfaces
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  totalChallenges: number;
  totalPoints: number;
  totalEvents: number;
  totalPosts: number;
  totalRewards: number;
  totalBadges: number;
  totalReplies: number;
  totalLikes: number;
  totalRewardsRedeemed: number;
  totalPointsRedeemed: number;
}

export interface UserSignup {
  date: string;
  signups: number;
}

export interface ChallengeCompletion {
  date: string;
  completions: number;
}

export interface PointsEarned {
  date: string;
  points: number;
}

export interface NameValue {
  name: string;
  count: number;
}

export interface LevelValue {
  level: string;
  count: number;
}

export interface CityValue {
  city: string;
  count: number;
  percentage: string;
}

export interface PostActivity {
    date: string;
    posts: number;
}

export interface RewardRedemption {
    date: string;
    redemptions: number;
}

export interface EventParticipation {
    event: string;
    participants: number;
}

export interface BadgeDistribution {
    badge: string;
    count: number;
}

export interface ForumActivity {
    type: "Posts" | "Replies" | "Likes";
    count: number;
}

export interface TopReward {
    reward: string;
    count: number;
}

export interface UserEngagement {
    user: string;
    activities: number;
}

export interface ChallengeDifficulty {
    difficulty: string;
    count: number;
}

export interface TeamPerformance {
    team: string;
    points: number;
}

export interface PointsDistribution {
    range: string;
    count: number;
}

export interface MonthlyRegistration {
    month: string;
    registrations: number;
}

export interface GeographicActivity {
    location: string;
    activity: number;
}

export interface RewardValue {
    reward: string;
    pointsSpent: number;
}

export interface RewardCategory {
    category: string;
    count: number;
}

export interface UserRewardPreference {
    reward: string;
    count: number;
}

export interface GrowthStats {
  userGrowth: number;
  teamGrowth: number;
  postGrowth: number;
  rewardGrowth: number;
}

export interface ChartData {
  userSignups: UserSignup[];
  challengeCompletions: ChallengeCompletion[];
  pointsEarned: PointsEarned[];
  challengeCategories: NameValue[];
  userLevels: LevelValue[];
  cityDistribution: CityValue[];
  postActivity: PostActivity[];
  rewardRedemptions: RewardRedemption[];
  eventParticipation: EventParticipation[];
  badgeDistribution: BadgeDistribution[];
  forumActivity: ForumActivity[];
  topRewards: TopReward[];
  userEngagement: UserEngagement[];
  challengeDifficulty: ChallengeDifficulty[];
  teamPerformance: TeamPerformance[];
  pointsDistribution: PointsDistribution[];
  monthlyRegistrations: MonthlyRegistration[];
  geographicActivity: GeographicActivity[];
  rewardValueAnalysis: RewardValue[];
  rewardCategories: RewardCategory[];
  userRewardPreferences: UserRewardPreference[];
}

export interface CityDistributionAnalysis {
  topCities: CityValue[];
  others: number;
  total: number;
}

export const fetchCityDistributionAnalysis = async (supabase: SupabaseClient): Promise<CityDistributionAnalysis> => {
  const { data } = await supabase
    .from("profiles")
    .select("city");

  const cityCounts: { [key: string]: number } = {};
  data?.forEach((user: any) => {
    const city = user.city || "Unknown";
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const sorted = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  const topCities = sorted.slice(0, 10).map(([city, count]) => ({
    city,
    count,
    percentage: ((count / total) * 100).toFixed(1)
  }));
  const others = sorted.slice(10).reduce((sum, [, count]) => sum + count, 0);
  return { topCities, others, total };
};

export interface MonthlyRegistrationAnalysis {
  months: string[];
  registrations: number[];
  cumulative: number[];
}

export const fetchMonthlyRegistrationAnalysis = async (supabase: SupabaseClient): Promise<MonthlyRegistrationAnalysis> => {
  const { data } = await supabase
    .from("profiles")
    .select("created_at");
  const byMonth: { [key: string]: number } = {};
  data?.forEach((row: any) => {
    const month = format(new Date(row.created_at), "yyyy-MM");
    byMonth[month] = (byMonth[month] || 0) + 1;
  });
  const months = Object.keys(byMonth).sort();
  const registrations = months.map(m => byMonth[m]);
  let cumulative = [] as number[];
  let sum = 0;
  for (const reg of registrations) {
    sum += reg;
    cumulative.push(sum);
  }
  return { months, registrations, cumulative };
};

// --- user_rewards analysis ---
export interface RewardRedemptionOverTime {
  period: string;
  redemptions: number;
}
export interface PointsSpentPerReward {
  reward: string;
  pointsSpent: number;
}
export interface UserRewardSegmentation {
  redeemed: number;
  notRedeemed: number;
}

export const fetchRewardRedemptionOverTime = async (supabase: SupabaseClient): Promise<RewardRedemptionOverTime[]> => {
  // Group by month for the last 12 months
  const { data } = await supabase
    .from("user_rewards")
    .select("redeemed_at")
    .not("redeemed_at", "is", null);
  const byMonth: { [key: string]: number } = {};
  data?.forEach((row: any) => {
    const month = format(new Date(row.redeemed_at), "yyyy-MM");
    byMonth[month] = (byMonth[month] || 0) + 1;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, redemptions]) => ({ period, redemptions }));
};

export const fetchPointsSpentPerReward = async (supabase: SupabaseClient): Promise<PointsSpentPerReward[]> => {
  const { data } = await supabase
    .from("user_rewards")
    .select("points_spent, rewards(name)");
  const pointsByReward: { [key: string]: number } = {};
  data?.forEach((row: any) => {
    const reward = row.rewards?.name || "Unknown";
    pointsByReward[reward] = (pointsByReward[reward] || 0) + (row.points_spent || 0);
  });
  return Object.entries(pointsByReward)
    .sort(([, a], [, b]) => b - a)
    .map(([reward, pointsSpent]) => ({ reward, pointsSpent }));
};

export const fetchUserRewardSegmentation = async (supabase: SupabaseClient): Promise<UserRewardSegmentation> => {
  // Users who have redeemed at least one reward
  const { data: redeemed } = await supabase
    .from("user_rewards")
    .select("user_id", { count: "exact" });
  // Total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  const redeemedCount = redeemed?.length || 0;
  return {
    redeemed: redeemedCount,
    notRedeemed: (totalUsers || 0) - redeemedCount,
  };
};

export const fetchStats = async (supabase: SupabaseClient): Promise<DashboardStats> => {
    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Active users (users with activity in last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const { count: activeUsers } = await supabase
      .from("user_activity")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo);

    // Total teams
    const { count: totalTeams } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true });

    // Total challenges
    const { count: totalChallenges } = await supabase
      .from("challenges")
      .select("*", { count: "exact", head: true });

    // Total points
    const { data: totalPointsData } = await supabase
      .from("profiles")
      .select("total_points");
    
    const totalPoints = totalPointsData?.reduce((sum: number, user: any) => sum + user.total_points, 0) || 0;

    // Total events
    const { count: totalEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // Total posts
    const { count: totalPosts } = await supabase
      .from("forum_posts")
      .select("*", { count: "exact", head: true });

    // Total rewards
    const { count: totalRewards } = await supabase
      .from("rewards")
      .select("*", { count: "exact", head: true });

    // Total badges
    const { count: totalBadges } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true });

    // Total replies
    const { count: totalReplies } = await supabase
      .from("forum_replies")
      .select("*", { count: "exact", head: true });

    // Total likes
    const { count: totalLikes } = await supabase
      .from("forum_likes")
      .select("*", { count: "exact", head: true });

    // Total rewards redeemed
    const { count: totalRewardsRedeemed } = await supabase
      .from("user_rewards")
      .select("*", { count: "exact", head: true });

    // Total points redeemed
    const { data: totalPointsRedeemedData } = await supabase
      .from("user_rewards")
      .select("points_spent");
    
    const totalPointsRedeemed = totalPointsRedeemedData?.reduce((sum: number, reward: any) => sum + reward.points_spent, 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalTeams: totalTeams || 0,
      totalChallenges: totalChallenges || 0,
      totalPoints: totalPoints || 0,
      totalEvents: totalEvents || 0,
      totalPosts: totalPosts || 0,
      totalRewards: totalRewards || 0,
      totalBadges: totalBadges || 0,
      totalReplies: totalReplies || 0,
      totalLikes: totalLikes || 0,
      totalRewardsRedeemed: totalRewardsRedeemed || 0,
      totalPointsRedeemed: totalPointsRedeemed || 0,
    };
}

export const fetchUserSignups = async (supabase: SupabaseClient): Promise<UserSignup[]> => {
    const promises = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date).toISOString();
        const endDate = endOfDay(date).toISOString();
        
        const promise = supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate)
          .lt("created_at", endDate)
          .then(({ count }) => ({
            date: format(date, "MMM dd"),
            signups: count || 0
          }));
        
        promises.push(promise);
    }
    return Promise.all(promises);
}

export const fetchChallengeCompletions = async (supabase: SupabaseClient): Promise<ChallengeCompletion[]> => {
    const promises = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date).toISOString();
        const endDate = endOfDay(date).toISOString();
        
        const promise = supabase
            .from("user_challenges")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed")
            .gte("completed_at", startDate)
            .lt("completed_at", endDate)
            .then(({ count }) => ({
                date: format(date, "MMM dd"),
                completions: count || 0
            }));

        promises.push(promise);
    }
    return Promise.all(promises);
}

export const fetchPointsEarned = async (supabase: SupabaseClient): Promise<PointsEarned[]> => {
    const promises = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date).toISOString();
        const endDate = endOfDay(date).toISOString();
        
        const promise = supabase
            .from("user_activity")
            .select("points_earned")
            .gte("created_at", startDate)
            .lt("created_at", endDate)
            .then(({ data }) => {
                const totalPoints = data?.reduce((sum, activity) => sum + (activity.points_earned || 0), 0) || 0;
                return {
                    date: format(date, "MMM dd"),
                    points: totalPoints
                };
            });
            
        promises.push(promise);
    }
    return Promise.all(promises);
}

export const fetchChallengeCategories = async (supabase: SupabaseClient): Promise<NameValue[]> => {
    const { data } = await supabase
        .from("challenges")
        .select("challenge_categories(name)")
        .eq("is_active", true);

    const categoryCounts: { [key: string]: number } = {};
    data?.forEach((challenge: any) => {
        const categoryName = challenge.challenge_categories?.name || "Unknown";
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    return Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count
    }));
}

export const fetchUserLevels = async (supabase: SupabaseClient): Promise<LevelValue[]> => {
    const { data } = await supabase
        .from("profiles")
        .select("level");

    const levelCounts: { [key: number]: number } = {};
    data?.forEach((user: any) => {
        const level = user.level || 1;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    return Object.entries(levelCounts).map(([level, count]) => ({
        level: `Level ${level}`,
        count
    }));
}

export const fetchChallengeDifficulty = async (supabase: SupabaseClient): Promise<ChallengeDifficulty[]> => {
    const { data } = await supabase
        .from("challenges")
        .select("difficulty");

    const difficultyCounts: { [key: string]: number } = {};
    data?.forEach((challenge: any) => {
        const difficulty = challenge.difficulty || "Unknown";
        difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;
    });

    return Object.entries(difficultyCounts).map(([difficulty, count]) => ({
        difficulty,
        count
    }));
}

export const fetchPointsDistribution = async (supabase: SupabaseClient): Promise<PointsDistribution[]> => {
    const { data } = await supabase
        .from("profiles")
        .select("total_points");

    const pointsRanges = [
        { range: "0-100", count: 0 },
        { range: "101-500", count: 0 },
        { range: "501-1000", count: 0 },
        { range: "1001-2000", count: 0 },
        { range: "2000+", count: 0 }
    ];

    data?.forEach((user: any) => {
        const points = user.total_points || 0;
        if (points <= 100) pointsRanges[0].count++;
        else if (points <= 500) pointsRanges[1].count++;
        else if (points <= 1000) pointsRanges[2].count++;
        else if (points <= 2000) pointsRanges[3].count++;
        else pointsRanges[4].count++;
    });

    return pointsRanges;
}

export const fetchCityDistribution = async (supabase: SupabaseClient): Promise<CityValue[]> => {
    const { data } = await supabase
        .from("profiles")
        .select("city");

    const cityCounts: { [key: string]: number } = {};
    data?.forEach((user: any) => {
        const city = user.city || "Unknown";
        cityCounts[city] = (cityCounts[city] || 0) + 1;
    });

    const cityDistributionData = Object.entries(cityCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([city, count]) => ({
          city,
          count,
          percentage: ((count / (data?.length || 1)) * 100).toFixed(1)
        }));
    
    return cityDistributionData.slice(0, 15);
}

export const fetchMonthlyRegistrations = async (supabase: SupabaseClient): Promise<MonthlyRegistration[]> => {
    const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", subDays(new Date(), 365).toISOString());

    const monthlyRegCounts: { [key: string]: number } = {};
    data?.forEach((registration: any) => {
        const month = format(new Date(registration.created_at), "MMM yyyy");
        monthlyRegCounts[month] = (monthlyRegCounts[month] || 0) + 1;
    });

    return Object.entries(monthlyRegCounts).map(([month, count]) => ({
        month,
        registrations: count
    }));
}

export const fetchPostActivity = async (supabase: SupabaseClient): Promise<PostActivity[]> => {
    const promises = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date).toISOString();
        const endDate = endOfDay(date).toISOString();
        
        const promise = supabase
            .from("forum_posts")
            .select("*", { count: "exact", head: true })
            .gte("created_at", startDate)
            .lt("created_at", endDate)
            .then(({ count }) => ({
                date: format(date, "MMM dd"),
                posts: count || 0
            }));
        
        promises.push(promise);
    }
    return Promise.all(promises);
}

export const fetchForumActivity = async (supabase: SupabaseClient): Promise<ForumActivity[]> => {
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    
    const { count: posts } = await supabase
        .from("forum_posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo);

    const { count: replies } = await supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo);

    const { count: likes } = await supabase
        .from("forum_likes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo);

    return [
        { type: "Posts", count: posts || 0 },
        { type: "Replies", count: replies || 0 },
        { type: "Likes", count: likes || 0 }
    ];
}

export const fetchUserEngagement = async (supabase: SupabaseClient): Promise<UserEngagement[]> => {
    const { data } = await supabase
        .from("user_activity")
        .select("user_id, profiles(name)")
        .gte("created_at", subDays(new Date(), 30).toISOString());

    const userActivityCounts: { [key: string]: number } = {};
    data?.forEach((activity: any) => {
        const userName = activity.profiles?.name || "Unknown";
        userActivityCounts[userName] = (userActivityCounts[userName] || 0) + 1;
    });

    return Object.entries(userActivityCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({
            user: name,
            activities: count
        }));
}

export const fetchRewardRedemptions = async (supabase: SupabaseClient): Promise<RewardRedemption[]> => {
    const promises = [];
    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const startDate = startOfDay(date).toISOString();
        const endDate = endOfDay(date).toISOString();
        
        const promise = supabase
            .from("user_rewards")
            .select("*", { count: "exact", head: true })
            .gte("redeemed_at", startDate)
            .lt("redeemed_at", endDate)
            .then(({ count }) => ({
                date: format(date, "MMM dd"),
                redemptions: count || 0
            }));
        
        promises.push(promise);
    }
    return Promise.all(promises);
}

export const fetchBadgeDistribution = async (supabase: SupabaseClient): Promise<BadgeDistribution[]> => {
    const { data } = await supabase
        .from("user_badges")
        .select("badges(name)");

    const badgeCounts: { [key: string]: number } = {};
    data?.forEach((userBadge: any) => {
        const badgeName = userBadge.badges?.name || "Unknown";
        badgeCounts[badgeName] = (badgeCounts[badgeName] || 0) + 1;
    });

    return Object.entries(badgeCounts).map(([name, count]) => ({
        badge: name,
        count
    }));
}

export const fetchTopRewards = async (supabase: SupabaseClient): Promise<TopReward[]> => {
    const { data } = await supabase
        .from("user_rewards")
        .select("rewards(name)");

    const rewardCounts: { [key: string]: number } = {};
    data?.forEach((userReward: any) => {
        const rewardName = userReward.rewards?.name || "Unknown";
        rewardCounts[rewardName] = (rewardCounts[rewardName] || 0) + 1;
    });

    return Object.entries(rewardCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({
            reward: name,
            count
        }));
}

export const fetchTeamPerformance = async (supabase: SupabaseClient): Promise<TeamPerformance[]> => {
    const { data } = await supabase
        .from("teams")
        .select("name, total_points")
        .order("total_points", { ascending: false })
        .limit(10);

    return data?.map((team: any) => ({
        team: team.name,
        points: team.total_points || 0
    })) || [];
}

export const fetchGrowthStats = async (supabase: SupabaseClient): Promise<GrowthStats> => {
  // Helper to calculate growth
  const calcGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const now = new Date();
  const startCurrent = subDays(now, 30).toISOString();
  const endCurrent = now.toISOString();
  const startPrevious = subDays(now, 60).toISOString();
  const endPrevious = subDays(now, 30).toISOString();

  // Users
  const { count: usersCurrent } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startCurrent)
    .lt("created_at", endCurrent);
  const { count: usersPrevious } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startPrevious)
    .lt("created_at", endPrevious);

  // Teams
  const { count: teamsCurrent } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startCurrent)
    .lt("created_at", endCurrent);
  const { count: teamsPrevious } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startPrevious)
    .lt("created_at", endPrevious);

  // Posts
  const { count: postsCurrent } = await supabase
    .from("forum_posts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startCurrent)
    .lt("created_at", endCurrent);
  const { count: postsPrevious } = await supabase
    .from("forum_posts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startPrevious)
    .lt("created_at", endPrevious);

  // Rewards
  const { count: rewardsCurrent } = await supabase
    .from("user_rewards")
    .select("*", { count: "exact", head: true })
    .gte("redeemed_at", startCurrent)
    .lt("redeemed_at", endCurrent);
  const { count: rewardsPrevious } = await supabase
    .from("user_rewards")
    .select("*", { count: "exact", head: true })
    .gte("redeemed_at", startPrevious)
    .lt("redeemed_at", endPrevious);

  return {
    userGrowth: calcGrowth(usersCurrent || 0, usersPrevious || 0),
    teamGrowth: calcGrowth(teamsCurrent || 0, teamsPrevious || 0),
    postGrowth: calcGrowth(postsCurrent || 0, postsPrevious || 0),
    rewardGrowth: calcGrowth(rewardsCurrent || 0, rewardsPrevious || 0),
  };
}; 
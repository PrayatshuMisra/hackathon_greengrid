"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/app/providers"
import { Coins, TreePine, Star, Award, TrendingUp, Check, Copy, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { QRModal } from "@/components/wallet/QRModal";
import jsPDF from "jspdf";

export function EcoWallet() {
  const [activeTab, setActiveTab] = useState("donations")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { user, supabase } = useApp()
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null) // Track which reward is being redeemed

  const [userStats, setUserStats] = useState({
    totalPoints: 0,
  })

  const [rewards, setRewards] = useState<any[]>([])
  const [userRewards, setUserRewards] = useState<any[]>([])
  const [userActivity, setUserActivity] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch user's current points
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setUserStats({
          totalPoints: profile.total_points || 0,
        });

        // Fetch available rewards
        const { data: rewardsData, error: rewardsError } = await supabase
          .from("rewards")
          .select("*")
          .eq("is_active", true)
          .order("points_cost", { ascending: true });
        
        if (rewardsError) throw rewardsError;
        setRewards(rewardsData || []);

        // Fetch user's redeemed rewards
        const { data: userRewardsData, error: userRewardsError } = await supabase
          .from("user_rewards")
          .select("*, rewards(name, category)")
          .eq("user_id", user.id)
          .order("redeemed_at", { ascending: false });
        
        if (userRewardsError) throw userRewardsError;
        setUserRewards(userRewardsData || []);

        // Fetch user activity for earned points
        const { data: activityData, error: activityError } = await supabase
          .from("user_activity")
          .select("*")
          .eq("user_id", user.id)
          .in("activity_type", ["challenge", "event", "badge"])
          .gte("points_earned", 0)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (activityError) throw activityError;
        setUserActivity(activityData || []);

      } catch (error) {
        console.error("Error fetching wallet data:", error);
        toast({
          title: "Error",
          description: "Failed to load wallet data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, supabase]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const redeemReward = async (reward: any) => {
    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "Please log in to redeem rewards",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple redemption attempts
    if (redeeming) {
      console.log("Redemption already in progress");
      return;
    }

    // Validate reward data
    if (!reward || !reward.id || !reward.points_cost) {
      console.error("Invalid reward data:", reward);
      toast({
        title: "Error",
        description: "Invalid reward data",
        variant: "destructive",
      });
      return;
    }

    setRedeeming(reward.id);

    try {
      console.log("Starting redemption for reward:", reward);
      console.log("Current user points:", userStats.totalPoints);
      console.log("Required points:", reward.points_cost);

      if (userStats.totalPoints < reward.points_cost) {
        toast({
          title: "Insufficient Points",
          description: `You need ${reward.points_cost - userStats.totalPoints} more points to redeem this reward.`,
          variant: "destructive",
        })
        return
      }

      // Generate redemption code
      const redemptionCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      console.log("Generated redemption code:", redemptionCode);

      // Insert into user_rewards table
      const userRewardData = {
        user_id: user.id,
        reward_id: reward.id,
        points_spent: reward.points_cost,
        redemption_code: redemptionCode,
        expires_at: new Date(Date.now() + (reward.validity_days || 365) * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      console.log("Inserting user reward data:", userRewardData);
      
      const { data: userReward, error: insertError } = await supabase
        .from("user_rewards")
        .insert(userRewardData)
        .select("*, rewards(name, category)")
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      console.log("User reward inserted successfully:", userReward);

      // Update user's points
      const newPoints = userStats.totalPoints - reward.points_cost;
      console.log("Updating user points from", userStats.totalPoints, "to", newPoints);
      
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ total_points: newPoints })
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      console.log("User points updated successfully");

      // Update local state
      setUserStats(prev => ({
        ...prev,
        totalPoints: newPoints,
      }));

      // Add to user rewards list
      setUserRewards(prev => [userReward, ...prev]);

      // Log activity
      const activityData = {
        user_id: user.id,
        activity_type: "reward",
        description: `Redeemed reward: ${reward.name}`,
        points_earned: -reward.points_cost,
        related_id: reward.id,
        related_type: "reward",
      };
      
      console.log("Logging activity:", activityData);
      
      const { error: activityError } = await supabase
        .from("user_activity")
        .insert(activityData);

      if (activityError) {
        console.error("Activity logging error:", activityError);
        // Don't throw here as the main redemption was successful
      }

      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed ${reward.name}. Your redemption code is ${redemptionCode}.`,
        variant: "success",
      })

    } catch (error: any) {
      console.error("Redemption error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to redeem reward",
        variant: "destructive",
      })
    } finally {
      setRedeeming(null);
    }
  }

  const getRewardsByCategory = (category: string) => {
    return rewards.filter(reward => reward.category === category);
  };

  const formatTransaction = (userReward: any) => {
    const reward = userReward.rewards;
    return {
      type: "redeemed",
      action: `Redeemed ${reward?.name || 'Unknown Reward'}`,
      points: -userReward.points_spent,
      date: new Date(userReward.redeemed_at).toLocaleDateString(),
      code: userReward.redemption_code,
      timestamp: new Date(userReward.redeemed_at).getTime(),
    };
  };

  const formatActivityTransaction = (activity: any) => {
    return {
      type: "earned",
      action: activity?.description || 'Unknown Activity',
      points: activity?.points_earned || 0,
      date: new Date(activity?.created_at || Date.now()).toLocaleDateString(),
      timestamp: new Date(activity?.created_at || Date.now()).getTime(),
      code: undefined,
    };
  };

  const getCombinedTransactions = () => {
    const rewardTransactions = userRewards.map(formatTransaction);
    const activityTransactions = userActivity.map(formatActivityTransaction);
    return [...rewardTransactions, ...activityTransactions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const downloadTransactionHistory = () => {
    if (!user) return;

    const transactions = getCombinedTransactions();
    if (transactions.length === 0) {
      toast({
        title: "No Transactions",
        description: "No transactions to download",
        variant: "destructive",
      });
      return;
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94); // Green color
    doc.text("GreenGrid EcoWallet", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Transaction History for ${user.name || user.email}`, 20, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    doc.text(`Total Available Points: ${userStats.totalPoints}`, 20, 55);
    
    // Add transaction list
    let yPosition = 75;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Add table header
    doc.setFillColor(34, 197, 94);
    doc.rect(20, yPosition - 5, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("Date", 25, yPosition);
    doc.text("Description", 60, yPosition);
    doc.text("Points", 130, yPosition);
    doc.text("Code", 160, yPosition);
    
    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    
    transactions.forEach((transaction, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const date = transaction.date;
      const description = transaction.action.length > 30 ? transaction.action.substring(0, 30) + "..." : transaction.action;
      const points = transaction.type === "earned" ? "+" + transaction.points : "-" + Math.abs(transaction.points);
      const code = transaction.code || "-";
      
      doc.text(date, 25, yPosition);
      doc.text(description, 60, yPosition);
      doc.text(points, 130, yPosition);
      doc.text(code, 160, yPosition);
      
      yPosition += 7;
    });
    
    // Add summary
    yPosition += 10;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Transaction Summary:", 20, yPosition);
    
    const earnedPoints = transactions
      .filter(t => t.type === "earned")
      .reduce((sum, t) => sum + t.points, 0);
    const spentPoints = transactions
      .filter(t => t.type === "spent")
      .reduce((sum, t) => sum + Math.abs(t.points), 0);
    
    doc.setFontSize(10);
    doc.text(`Total Points Earned: ${earnedPoints}`, 20, yPosition + 10);
    doc.text(`Total Points Spent: ${spentPoints}`, 20, yPosition + 20);
    doc.text(`Current Balance: ${userStats.totalPoints}`, 20, yPosition + 30);
    
    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("GreenGrid - Making the world greener, one point at a time", 20, doc.internal.pageSize.height - 10);
    
    // Download the PDF
    const fileName = `ecowallet_transactions_${user.name || user.email}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Download Complete",
      description: "Transaction history has been downloaded as PDF",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {!user?.id ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">EcoWallet</h2>
          <p className="text-gray-600 mb-4">Please log in to view and redeem your EcoPoints</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Log In
          </Button>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">EcoWallet</h2>
          <p className="text-gray-600">Loading your wallet...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-green-800">EcoWallet</h2>
              <p className="text-green-600">Redeem your EcoPoints for real rewards</p>
            </div>
            <Card className="p-4 bg-gradient-to-r from-green-100 to-blue-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{userStats.totalPoints.toLocaleString()}</div>
                <div className="text-sm text-green-600">Available EcoPoints</div>
              </div>
            </Card>
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="donations">Tree Donations</TabsTrigger>
              <TabsTrigger value="coupons">Green Coupons</TabsTrigger>
              <TabsTrigger value="products">Eco Products</TabsTrigger>
              <TabsTrigger value="nfts">Digital Badges</TabsTrigger>
            </TabsList>

            <TabsContent value="donations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRewardsByCategory("donation").map((donation, index) => (
                  <Card key={donation.id} className="border-green-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <TreePine className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">{donation.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">by {donation.brand}</p>
                      <p className="text-sm text-green-600 mb-3">{donation.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-700">{donation.points_cost} pts</span>
                        <QRModal
                          rewardName={donation.name}
                          redemptionCode={donation.id}
                          disabled={userStats.totalPoints < donation.points_cost || redeeming === donation.id}
                          onRedeem={() => redeemReward(donation)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRewardsByCategory("coupon").map((coupon, index) => (
                  <Card key={coupon.id} className="border-blue-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Coins className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{coupon.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">by {coupon.brand}</p>
                      <p className="text-sm text-blue-600 mb-3">Valid for {coupon.validity_days} days</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-blue-700">{coupon.points_cost} pts</span>
                        <QRModal
                          rewardName={coupon.name}
                          redemptionCode={coupon.id}
                          disabled={userStats.totalPoints < coupon.points_cost || redeeming === coupon.id}
                          onRedeem={() => redeemReward(coupon)}
                        />
                      </div>
                      {coupon.coupon_code && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <code className="text-sm font-mono">{coupon.coupon_code}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyCode(coupon.coupon_code)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedCode === coupon.coupon_code ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRewardsByCategory("product").map((product, index) => (
                  <Card key={product.id} className="border-orange-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Star className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold">{product.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-orange-700">{product.points_cost} pts</span>
                        <QRModal
                          rewardName={product.name}
                          redemptionCode={product.id}
                          disabled={userStats.totalPoints < product.points_cost || redeeming === product.id}
                          onRedeem={() => redeemReward(product)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="nfts" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getRewardsByCategory("nft").map((nft, index) => (
                  <Card key={nft.id} className="border-purple-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Award className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold">{nft.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{nft.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-purple-700">{nft.points_cost} pts</span>
                        <QRModal
                          rewardName={nft.name}
                          redemptionCode={nft.id}
                          disabled={userStats.totalPoints < nft.points_cost || redeeming === nft.id}
                          onRedeem={() => redeemReward(nft)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Recent Transactions</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadTransactionHistory}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Invoice</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getCombinedTransactions().length > 0 ? (
                  getCombinedTransactions().map((transaction, index) => {
                    return (
                      <div key={transaction.timestamp} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === "earned" ? "bg-green-100" : "bg-red-100"
                          }`}>
                            {transaction.type === "earned" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <Coins className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.action}</p>
                            <p className="text-xs text-gray-500">{transaction.date}</p>
                            {transaction.code && (
                              <p className="text-xs text-blue-600">Code: {transaction.code}</p>
                            )}
                          </div>
                        </div>
                        <div className={`font-bold ${transaction.type === "earned" ? "text-green-600" : "text-red-600"}`}>
                          {transaction.points > 0 ? "+" : ""}
                          {transaction.points} pts
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No transactions yet. Start earning points to redeem rewards!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/app/providers"
import { Coins, TreePine, Star, Award, TrendingUp, Check, Copy, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { QRModal } from "@/components/wallet/QRModal"

interface Reward {
  id: string
  name: string
  description: string
  category: 'donation' | 'coupon' | 'product' | 'nft'
  points_cost: number
  stock_quantity?: number
  current_stock?: number
  brand?: string
  validity_days?: number
  discount_percentage?: number
  coupon_code?: string
  image_url?: string
  is_active: boolean
}

interface UserReward {
  id: string
  user_id: string
  reward_id: string
  points_spent: number
  status: 'redeemed' | 'used' | 'expired' | 'cancelled'
  redemption_code: string
  expires_at: string
  used_at?: string
  redeemed_at: string
  reward: Reward
}

interface UserActivity {
  id: string
  user_id: string
  activity_type: string
  description: string
  points_earned: number
  related_id?: string
  related_type?: string
  created_at: string
}

export function EcoWallet() {
  const [activeTab, setActiveTab] = useState("donations")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userRewards, setUserRewards] = useState<UserReward[]>([])
  const [recentTransactions, setRecentTransactions] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const { user, supabase } = useApp()

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id])

  const fetchData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Fetch active rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true })

      if (rewardsError) throw rewardsError

      // Fetch user's redeemed rewards
      const { data: userRewardsData, error: userRewardsError } = await supabase
        .from('user_rewards')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false })

      if (userRewardsError) throw userRewardsError

      // Fetch recent user activity (transactions)
      const { data: activityData, error: activityError } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activityError) throw activityError

      setRewards(rewardsData || [])
      setUserRewards(userRewardsData || [])
      setRecentTransactions(activityData || [])
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast({
      title: "Code Copied",
      description: "Redemption code copied to clipboard",
    })
  }

  const redeemReward = async (reward: Reward) => {
    if (!user?.id) return

    // Check if user has enough points
    if (user.total_points < reward.points_cost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.points_cost - user.total_points} more points to redeem this reward.`,
        variant: "destructive",
      })
      return
    }

    // Check if reward is in stock
    if (reward.current_stock !== null && reward.current_stock !== undefined && reward.current_stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This reward is currently out of stock.",
        variant: "destructive",
      })
      return
    }

    setRedeeming(reward.id)

    try {
      // Generate redemption code
      const redemptionCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      
      // Calculate expiry date
      const expiresAt = reward.validity_days 
        ? new Date(Date.now() + reward.validity_days * 24 * 60 * 60 * 1000).toISOString()
        : null

      // Insert user reward record
      const { data: userRewardData, error: insertError } = await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          points_spent: reward.points_cost,
          redemption_code: redemptionCode,
          expires_at: expiresAt,
          status: 'redeemed'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Update user points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          total_points: user.total_points - reward.points_cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Update reward stock if applicable
      if (reward.current_stock !== null && reward.current_stock !== undefined) {
        const { error: stockError } = await supabase
          .from('rewards')
          .update({ 
            current_stock: reward.current_stock - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', reward.id)

        if (stockError) throw stockError
      }

      // Create activity record
      const { error: activityError } = await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: 'reward_redeemed',
          description: `Redeemed ${reward.name}`,
          points_earned: -reward.points_cost,
          related_id: reward.id,
          related_type: 'reward'
        })

      if (activityError) throw activityError

      // Create notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Reward Redeemed!',
          message: `You've successfully redeemed ${reward.name}. Your redemption code is ${redemptionCode}.`,
          type: 'reward',
          data: {
            reward_id: reward.id,
            reward_name: reward.name,
            redemption_code: redemptionCode
          }
        })

      if (notificationError) console.error('Notification error:', notificationError)

      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed ${reward.name}. Your redemption code is ${redemptionCode}.`,
        variant: "success",
      })

      // Refresh data
      fetchData()

    } catch (error: any) {
      console.error("Redemption error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to redeem reward",
        variant: "destructive",
      })
    } finally {
      setRedeeming(null)
    }
  }

  const getRewardsByCategory = (category: string) => {
    return rewards.filter(reward => reward.category === category)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-green-800">EcoWallet</h2>
          <p className="text-green-600">Redeem your EcoPoints for real rewards</p>
        </div>
        <Card className="p-4 bg-gradient-to-r from-green-100 to-blue-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{user?.total_points || 0}</div>
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
            {getRewardsByCategory('donation').map((reward) => (
              <Card key={reward.id} className="border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <TreePine className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">{reward.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                  {reward.brand && (
                    <p className="text-sm text-green-600 mb-3">by {reward.brand}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-700">{reward.points_cost} pts</span>
                    <QRModal
                      qrImageSrc="/qr/meme-reward.jpg"
                      disabled={!user || user.total_points < reward.points_cost || (reward.current_stock !== null && reward.current_stock !== undefined && reward.current_stock <= 0)}
                      onRedeem={() => redeemReward(reward)}
                      loading={redeeming === reward.id}
                    />
                  </div>
                  {reward.current_stock !== null && reward.current_stock !== undefined && (
                    <p className="text-xs text-gray-500 mt-2">
                      {reward.current_stock > 0 ? `${reward.current_stock} left` : 'Out of stock'}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getRewardsByCategory('coupon').map((reward) => (
              <Card key={reward.id} className="border-blue-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Coins className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{reward.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                  {reward.brand && (
                    <p className="text-sm text-blue-600 mb-3">by {reward.brand}</p>
                  )}
                  {reward.validity_days && (
                    <p className="text-sm text-blue-600 mb-3">Valid for {reward.validity_days} days</p>
                  )}
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-blue-700">{reward.points_cost} pts</span>
                    <QRModal
                      qrImageSrc="/qr/meme-reward.jpg"
                      disabled={!user || user.total_points < reward.points_cost || (reward.current_stock !== null && reward.current_stock !== undefined && reward.current_stock <= 0)}
                      onRedeem={() => redeemReward(reward)}
                      loading={redeeming === reward.id}
                    />
                  </div>
                  {reward.coupon_code && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <code className="text-sm font-mono">{reward.coupon_code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(reward.coupon_code!)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedCode === reward.coupon_code ? (
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
            {getRewardsByCategory('product').map((reward) => (
              <Card key={reward.id} className="border-orange-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold">{reward.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-orange-700">{reward.points_cost} pts</span>
                    <QRModal
                      qrImageSrc="/qr/meme-reward.jpg"
                      disabled={!user || user.total_points < reward.points_cost || (reward.current_stock !== null && reward.current_stock !== undefined && reward.current_stock <= 0)}
                      onRedeem={() => redeemReward(reward)}
                      loading={redeeming === reward.id}
                    />
                  </div>
                  {reward.current_stock !== null && reward.current_stock !== undefined && (
                    <p className="text-xs text-gray-500 mt-2">
                      {reward.current_stock > 0 ? `${reward.current_stock} left` : 'Out of stock'}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getRewardsByCategory('nft').map((reward) => (
              <Card key={reward.id} className="border-purple-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">{reward.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-700">{reward.points_cost} pts</span>
                    <QRModal
                      qrImageSrc="/qr/meme-reward.jpg"
                      disabled={!user || user.total_points < reward.points_cost || (reward.current_stock !== null && reward.current_stock !== undefined && reward.current_stock <= 0)}
                      onRedeem={() => redeemReward(reward)}
                      loading={redeeming === reward.id}
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
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No recent transactions</p>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.points_earned > 0 ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {transaction.points_earned > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <Coins className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  <div className={`font-bold ${transaction.points_earned > 0 ? "text-green-600" : "text-red-600"}`}>
                    {transaction.points_earned > 0 ? "+" : ""}
                    {transaction.points_earned} pts
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
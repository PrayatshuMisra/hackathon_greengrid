"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/app/providers"
import { Coins, TreePine, Star, Award, TrendingUp, Check, Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function EcoWallet() {
  const [activeTab, setActiveTab] = useState("donations")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { user } = useApp()

  const [userStats, setUserStats] = useState({
    totalPoints: 2340,
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const redeemReward = async (reward: any) => {
    try {
      if (userStats.totalPoints < reward.cost) {
        toast({
          title: "Insufficient Points",
          description: `You need ${reward.cost - userStats.totalPoints} more points to redeem this reward.`,
          variant: "destructive",
        })
        return
      }

      const redemptionCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      setUserStats((prev) => ({
        ...prev,
        totalPoints: prev.totalPoints - reward.cost,
      }))

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
    }
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
            <div className="text-2xl font-bold text-green-700">{userStats.totalPoints}</div>
            <div className="text-sm text-green-600">Available EcoPoints</div>
          </div>
        </Card>
      </div>

      {/* Reward Categories */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="donations">Tree Donations</TabsTrigger>
          <TabsTrigger value="coupons">Green Coupons</TabsTrigger>
          <TabsTrigger value="products">Eco Products</TabsTrigger>
          <TabsTrigger value="nfts">Digital Badges</TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Plant 1 Tree", cost: 100, impact: "1 tree planted", org: "Green India Foundation" },
              { name: "Plant 5 Trees", cost: 450, impact: "5 trees planted", org: "Forest Revival NGO" },
              { name: "Mangrove Restoration", cost: 200, impact: "2 mangroves planted", org: "Coastal Care" },
              { name: "Urban Forest", cost: 800, impact: "10 saplings", org: "City Green Initiative" },
            ].map((donation, index) => (
              <Card key={index} className="border-green-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <TreePine className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">{donation.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">by {donation.org}</p>
                  <p className="text-sm text-green-600 mb-3">Impact: {donation.impact}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-700">{donation.cost} pts</span>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={userStats.totalPoints < donation.cost}
                      onClick={() => redeemReward(donation)}
                    >
                      Redeem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Organic Store 20% Off",
                cost: 300,
                brand: "Nature's Basket",
                validity: "30 days",
                code: "ECO20",
              },
              {
                name: "Solar Panel 15% Discount",
                cost: 1500,
                brand: "SunPower India",
                validity: "60 days",
                code: "SOLAR15",
              },
              {
                name: "Electric Vehicle Test Drive",
                cost: 200,
                brand: "Tata Motors",
                validity: "15 days",
                code: "EVDRIVE",
              },
              {
                name: "Eco-Friendly Clothing 25% Off",
                cost: 400,
                brand: "Sustainable Fashion Co.",
                validity: "45 days",
                code: "GREEN25",
              },
            ].map((coupon, index) => (
              <Card key={index} className="border-blue-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Coins className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">{coupon.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">by {coupon.brand}</p>
                  <p className="text-sm text-blue-600 mb-3">Valid for {coupon.validity}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-blue-700">{coupon.cost} pts</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={userStats.totalPoints < coupon.cost}
                      onClick={() => redeemReward(coupon)}
                    >
                      Redeem
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <code className="text-sm font-mono">{coupon.code}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="h-6 w-6 p-0"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Bamboo Water Bottle", cost: 600, description: "Sustainable hydration solution" },
              { name: "Solar Power Bank", cost: 1200, description: "Charge devices with solar energy" },
              { name: "Organic Seed Kit", cost: 300, description: "Grow your own vegetables" },
              { name: "Eco-Friendly Notebook", cost: 150, description: "Made from recycled paper" },
            ].map((product, index) => (
              <Card key={index} className="border-orange-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Star className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold">{product.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-orange-700">{product.cost} pts</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={userStats.totalPoints < product.cost}
                      onClick={() => redeemReward(product)}
                    >
                      Redeem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nfts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Climate Hero Badge", cost: 500, rarity: "Rare", description: "Digital achievement badge" },
              {
                name: "Eco Warrior Certificate",
                cost: 800,
                rarity: "Epic",
                description: "Verified eco-action certificate",
              },
              {
                name: "Green Champion Trophy",
                cost: 1000,
                rarity: "Legendary",
                description: "Ultimate eco-achievement",
              },
              { name: "Planet Protector Emblem", cost: 350, rarity: "Common", description: "Show your commitment" },
            ].map((nft, index) => (
              <Card key={index} className="border-purple-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">{nft.name}</h3>
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {nft.rarity}
                  </Badge>
                  <p className="text-sm text-gray-600 mb-3">{nft.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-700">{nft.cost} pts</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={userStats.totalPoints < nft.cost}
                      onClick={() => redeemReward(nft)}
                    >
                      Mint
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: "earned", action: "Completed Plastic-Free Week", points: 150, date: "2 days ago" },
              { type: "redeemed", action: "Planted 1 Tree", points: -100, date: "5 days ago" },
              { type: "earned", action: "Bike Commute Challenge", points: 200, date: "1 week ago" },
              { type: "redeemed", action: "Organic Store Coupon", points: -300, date: "2 weeks ago" },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === "earned" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {transaction.type === "earned" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <Coins className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.action}</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
                <div className={`font-bold ${transaction.type === "earned" ? "text-green-600" : "text-red-600"}`}>
                  {transaction.points > 0 ? "+" : ""}
                  {transaction.points} pts
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

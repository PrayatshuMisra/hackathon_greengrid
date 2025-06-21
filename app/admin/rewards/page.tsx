"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Filter, ArrowUpDown, Loader2, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type Reward = {
  id: string
  name: string
  description?: string
  category: "donation" | "coupon" | "product" | "nft"
  points_cost: number
  stock_quantity?: number | null
  current_stock?: number | null
  brand?: string | null
  validity_days?: number | null
  discount_percentage?: number | null
  coupon_code?: string | null
  image_url?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function RewardsAdmin() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Reward>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRewards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortField, sortDirection])

  async function fetchRewards() {
    try {
      setLoading(true)
      let query = supabase
        .from("rewards")
        .select("*")
        .order(sortField as string, { ascending: sortDirection === "asc" })
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`)
      }
      const { data, error } = await query
      if (error) throw error
      setRewards((data as Reward[]) || [])
    } catch (error) {
      console.error("Error fetching rewards:", error)
      toast({
        title: "Error fetching rewards",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof Reward) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Placeholder for create/edit
  const handleCreateReward = async (_formData: Reward) => {
    toast({
      title: "Coming soon!",
      description: "Reward creation form will be available soon.",
    })
    setIsCreateDialogOpen(false)
  }
  const handleUpdateReward = async (_formData: Reward) => {
    toast({
      title: "Coming soon!",
      description: "Reward editing form will be available soon.",
    })
    setIsEditDialogOpen(false)
  }

  const handleDeleteReward = async () => {
    if (!selectedReward) return
    try {
      const { error } = await supabase.from("rewards").delete().eq("id", selectedReward.id)
      if (error) throw error
      toast({
        title: "Reward deleted",
        description: "The reward has been deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchRewards()
    } catch (error) {
      console.error("Error deleting reward:", error)
      toast({
        title: "Error deleting reward",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const getCategoryBadge = (category: Reward["category"]) => {
    const colors: Record<Reward["category"], string> = {
      donation: "bg-green-100 text-green-800",
      coupon: "bg-blue-100 text-blue-800",
      product: "bg-orange-100 text-orange-800",
      nft: "bg-purple-100 text-purple-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  const filteredRewards = rewards.filter((reward) =>
    reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reward.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reward.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rewards Management</h1>
          <p className="text-gray-600">Manage eco-friendly rewards and incentives</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Reward
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Reward</DialogTitle>
              <DialogDescription>Add a new reward that users can redeem with their EcoPoints.</DialogDescription>
            </DialogHeader>
            <div className="text-center py-8 text-gray-500">Reward form coming soon!</div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search rewards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleSort("name")}> <ArrowUpDown className="h-4 w-4 mr-2" /> Name </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("points_cost")}> <ArrowUpDown className="h-4 w-4 mr-2" /> Points Cost </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("created_at")}> <ArrowUpDown className="h-4 w-4 mr-2" /> Created Date </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Points Cost</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredRewards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No rewards found
                </TableCell>
              </TableRow>
            ) : (
              filteredRewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reward.name}</div>
                      <div className="text-sm text-gray-500">{reward.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadge(reward.category)}>
                      {reward.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{reward.points_cost} pts</TableCell>
                  <TableCell>{reward.brand || "-"}</TableCell>
                  <TableCell>
                    {reward.current_stock !== null && reward.current_stock !== undefined ? (
                      <span className={reward.current_stock > 0 ? "text-green-600" : "text-red-600"}>
                        {reward.current_stock} / {reward.stock_quantity || "∞"}
                      </span>
                    ) : (
                      "Unlimited"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reward.is_active ? "default" : "secondary"}>
                      {reward.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedReward(reward)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedReward(reward)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedReward(reward)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
            <DialogDescription>Update the reward details.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8 text-gray-500">Reward edit form coming soon!</div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedReward?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReward}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reward Details</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedReward.name}</h3>
                <p className="text-gray-600">{selectedReward.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p>{selectedReward.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Points Cost</label>
                  <p>{selectedReward.points_cost} pts</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Brand</label>
                  <p>{selectedReward.brand || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Validity</label>
                  <p>{selectedReward.validity_days ? `${selectedReward.validity_days} days` : "No expiry"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Stock</label>
                  <p>
                    {selectedReward.current_stock !== null && selectedReward.current_stock !== undefined
                      ? `${selectedReward.current_stock} / ${selectedReward.stock_quantity || "∞"}`
                      : "Unlimited"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={selectedReward.is_active ? "default" : "secondary"}>
                    {selectedReward.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              {selectedReward.coupon_code && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Coupon Code</label>
                  <p className="font-mono bg-gray-100 p-2 rounded">{selectedReward.coupon_code}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
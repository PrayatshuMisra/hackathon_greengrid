"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, Filter, ArrowUpDown, Loader2 } from "lucide-react"
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
import { ChallengeForm } from "@/components/admin/ChallengeForm"

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  image_url?: string;
  challenge_category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  [key: string]: any;
}

export default function ChallengesAdmin() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc"|"desc">("desc")
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchChallenges()
  }, [sortField, sortDirection])

  async function fetchChallenges() {
    try {
      setLoading(true)
      const query = supabase
        .from("challenges")
        .select(`*, challenge_category:category_id(id, name, icon, color)`)
        .order(sortField, { ascending: sortDirection === "asc" })
      const { data, error } = await query
      if (error) throw error
      setChallenges((data as Challenge[]) || [])
    } catch (error: unknown) {
      console.error("Error fetching challenges:", error)
      toast({
        title: "Error fetching challenges",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleCreateChallenge = async (formData: Partial<Challenge>) => {
    try {
      const res = await fetch("/api/admin/update-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", data: formData })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Unknown error")
      toast({
        title: "Challenge created",
        description: "The challenge has been created successfully",
      })
      setIsCreateDialogOpen(false)
      fetchChallenges()
    } catch (error: unknown) {
      console.error("Error creating challenge:", error)
      toast({
        title: "Error creating challenge",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const handleUpdateChallenge = async (formData: Partial<Challenge>) => {
    if (!selectedChallenge) return
    try {
      const res = await fetch("/api/admin/update-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id: selectedChallenge.id, data: formData })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Unknown error")
      toast({
        title: "Challenge updated",
        description: "The challenge has been updated successfully",
      })
      setIsEditDialogOpen(false)
      fetchChallenges()
    } catch (error: unknown) {
      console.error("Error updating challenge:", error)
      toast({
        title: "Error updating challenge",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const handleDeleteChallenge = async () => {
    if (!selectedChallenge) return
    try {
      const { error } = await supabase.from("challenges").delete().eq("id", selectedChallenge.id)
      if (error) throw error
      toast({
        title: "Challenge deleted",
        description: "The challenge has been deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchChallenges()
    } catch (error: unknown) {
      console.error("Error deleting challenge:", error)
      toast({
        title: "Error deleting challenge",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const filteredChallenges = challenges.filter(
    (challenge) =>
      challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Challenges</h1>
          <p className="text-muted-foreground">Manage environmental challenges on the platform</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Challenge</DialogTitle>
              <DialogDescription>Add a new environmental challenge to the platform</DialogDescription>
            </DialogHeader>
            <ChallengeForm onSubmit={handleCreateChallenge} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search challenges..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("title")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Title
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("points")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Points
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("created_at")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading challenges...</p>
                </TableCell>
              </TableRow>
            ) : filteredChallenges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-sm text-gray-500">No challenges found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredChallenges.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.title}</TableCell>
                  <TableCell>{challenge.challenge_category?.name || "Uncategorized"}</TableCell>
                  <TableCell>{challenge.points}</TableCell>
                  <TableCell>
                    <Badge
                      variant={challenge.is_active ? "default" : "outline"}
                      className={
                        challenge.is_active
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {challenge.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(challenge.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <span className="sr-only">Open menu</span>
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                          >
                            <path
                              d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                              fill="currentColor"
                              fillRule="evenodd"
                              clipRule="evenodd"
                            ></path>
                          </svg>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedChallenge(challenge)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedChallenge(challenge)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedChallenge(challenge)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

      {/* View Challenge Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Challenge Details</DialogTitle>
          </DialogHeader>
          {selectedChallenge && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedChallenge.title}</h3>
                <Badge
                  variant={selectedChallenge.is_active ? "default" : "outline"}
                  className={
                    selectedChallenge.is_active
                      ? "bg-green-100 text-green-800 hover:bg-green-100 mt-2"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 mt-2"
                  }
                >
                  {selectedChallenge.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p>{selectedChallenge.challenge_category?.name || "Uncategorized"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Points</p>
                  <p>{selectedChallenge.points}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration (days)</p>
                  <p>{selectedChallenge.duration_days}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p>{new Date(selectedChallenge.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1">{selectedChallenge.description}</p>
              </div>

              {selectedChallenge.image_url && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Image</p>
                  <img
                    src={selectedChallenge.image_url || "/placeholder.svg"}
                    alt={selectedChallenge.title}
                    className="mt-2 rounded-md max-h-40 object-cover"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Challenge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Challenge</DialogTitle>
            <DialogDescription>Update the challenge details</DialogDescription>
          </DialogHeader>
          <ChallengeForm challenge={selectedChallenge ?? undefined} onSubmit={handleUpdateChallenge} />
        </DialogContent>
      </Dialog>

      {/* Delete Challenge Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this challenge? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteChallenge}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Trash2, Eye, Filter, ArrowUpDown, Loader2, Users } from "lucide-react"
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
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { TeamForm } from "@/components/admin/TeamForm"

export default function TeamsAdmin() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTeams()
  }, [sortField, sortDirection])

  async function fetchTeams() {
    try {
      setLoading(true)

      // Modified query to avoid the recursive policy issue
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order(sortField, { ascending: sortDirection === "asc" })

      if (teamsError) throw teamsError

      // Fetch member counts separately to avoid recursion
      const teamIds = teamsData.map((team) => team.id)
      const { data: memberCounts, error: memberCountsError } = await supabase
        .from("team_members")
        .select("team_id, count")
        .in("team_id", teamIds)
        .group("team_id")

      if (memberCountsError) throw memberCountsError

      // Create a map of team_id to member count
      const countMap = {}
      memberCounts?.forEach((item) => {
        countMap[item.team_id] = Number.parseInt(item.count)
      })

      // Combine the data
      const processedTeams = teamsData.map((team) => ({
        ...team,
        member_count: countMap[team.id] || 0,
      }))

      setTeams(processedTeams || [])
    } catch (error) {
      console.error("Error fetching teams:", error)
      toast({
        title: "Error fetching teams",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleUpdateTeam = async (formData) => {
    try {
      const { data, error } = await supabase.from("teams").update(formData).eq("id", selectedTeam.id).select()

      if (error) throw error

      toast({
        title: "Team updated",
        description: "The team has been updated successfully",
      })

      setIsEditDialogOpen(false)
      fetchTeams()
    } catch (error) {
      console.error("Error updating team:", error)
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteTeam = async () => {
    try {
      const { error } = await supabase.from("teams").delete().eq("id", selectedTeam.id)

      if (error) throw error

      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      fetchTeams()
    } catch (error) {
      console.error("Error deleting team:", error)
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.city?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">Manage teams on the platform</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search teams..."
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
                  onClick={() => handleSort("name")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Team Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>City</TableHead>
              <TableHead>Members</TableHead>
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
                  <p className="text-sm text-gray-500 mt-2">Loading teams...</p>
                </TableCell>
              </TableRow>
            ) : filteredTeams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-sm text-gray-500">No teams found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <Users className="h-4 w-4 text-green-600" />
                      </div>
                      {team.name}
                    </div>
                  </TableCell>
                  <TableCell>{team.city || "N/A"}</TableCell>
                  <TableCell>{team.member_count}</TableCell>
                  <TableCell>{team.points || 0}</TableCell>
                  <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
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
                            setSelectedTeam(team)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTeam(team)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTeam(team)
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

      {/* View Team Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTeam.name}</h3>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mt-2">
                  {selectedTeam.member_count} {selectedTeam.member_count === 1 ? "Member" : "Members"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">City</p>
                  <p>{selectedTeam.city || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p>{new Date(selectedTeam.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Points</p>
                  <p>{selectedTeam.points || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Invite Code</p>
                  <p className="font-mono">{selectedTeam.invite_code || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1">{selectedTeam.description || "No description provided"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team details</DialogDescription>
          </DialogHeader>
          {selectedTeam && <TeamForm team={selectedTeam} onSubmit={handleUpdateTeam} />}
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

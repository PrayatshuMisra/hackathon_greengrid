"use client"

import { useState, useEffect } from "react"
import { Search, Trash2, Eye, Filter, ArrowUpDown, Loader2, CheckCircle, XCircle } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { AIVerification } from "@/components/ai/AIVerification"

export default function VerificationsAdmin() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubmissions()
  }, [sortField, sortDirection])

  async function fetchSubmissions() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("challenge_submissions")
        .select(`
          *,
          user:user_id(id, name, avatar_url),
          challenge:challenge_id(id, title, description)
        `)
        .order(sortField, { ascending: sortDirection === "asc" })

      if (error) throw error

      setSubmissions(data || [])
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast({
        title: "Error fetching submissions",
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

  const handleApproveSubmission = async () => {
    try {
      const { error } = await supabase
        .from("challenge_submissions")
        .update({ status: "approved" })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      toast({
        title: "Submission approved",
        description: "The submission has been approved successfully",
      })

      setIsViewDialogOpen(false)
      fetchSubmissions()
    } catch (error) {
      console.error("Error approving submission:", error)
      toast({
        title: "Error approving submission",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRejectSubmission = async () => {
    try {
      const { error } = await supabase
        .from("challenge_submissions")
        .update({ status: "rejected" })
        .eq("id", selectedSubmission.id)

      if (error) throw error

      toast({
        title: "Submission rejected",
        description: "The submission has been rejected",
      })

      setIsViewDialogOpen(false)
      fetchSubmissions()
    } catch (error) {
      console.error("Error rejecting submission:", error)
      toast({
        title: "Error rejecting submission",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubmission = async () => {
    try {
      const { error } = await supabase.from("challenge_submissions").delete().eq("id", selectedSubmission.id)

      if (error) throw error

      toast({
        title: "Submission deleted",
        description: "The submission has been deleted successfully",
      })

      setIsDeleteDialogOpen(false)
      fetchSubmissions()
    } catch (error) {
      console.error("Error deleting submission:", error)
      toast({
        title: "Error deleting submission",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredSubmissions = submissions.filter(
    (submission) =>
      submission.challenge?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verifications</h1>
        <p className="text-muted-foreground">Review and verify challenge submissions</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search submissions..."
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
                  onClick={() => handleSort("challenge_id")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Challenge
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("created_at")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Submitted
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading submissions...</p>
                </TableCell>
              </TableRow>
            ) : filteredSubmissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <p className="text-sm text-gray-500">No submissions found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.challenge?.title || "Unknown challenge"}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={submission.user?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {submission.user?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {submission.user?.name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={submission.status === "pending" ? "outline" : "default"}
                      className={
                        submission.status === "approved"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : submission.status === "rejected"
                            ? "bg-red-100 text-red-800 hover:bg-red-100"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {submission.status === "approved"
                        ? "Approved"
                        : submission.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
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
                            setSelectedSubmission(submission)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {submission.status === "pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubmission(submission)
                                handleApproveSubmission()
                              }}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubmission(submission)
                                handleRejectSubmission()
                              }}
                              className="text-red-600"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSubmission(submission)
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

      {/* View Submission Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedSubmission.challenge?.title || "Unknown challenge"}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={selectedSubmission.user?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {selectedSubmission.user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedSubmission.user?.name || "Unknown"}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(selectedSubmission.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge
                  variant={selectedSubmission.status === "pending" ? "outline" : "default"}
                  className={
                    selectedSubmission.status === "approved"
                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                      : selectedSubmission.status === "rejected"
                        ? "bg-red-100 text-red-800 hover:bg-red-100"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                  }
                >
                  {selectedSubmission.status === "approved"
                    ? "Approved"
                    : selectedSubmission.status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Challenge Description</p>
                <p className="mt-1">{selectedSubmission.challenge?.description || "No description available"}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Submission Notes</p>
                <p className="mt-1">{selectedSubmission.notes || "No notes provided"}</p>
              </div>

              {selectedSubmission.proof_image && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Proof Image</p>
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <img
                      src={selectedSubmission.proof_image || "/placeholder.svg"}
                      alt="Proof"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              {selectedSubmission.status === "pending" && (
                <div className="border-t pt-4">
                  <p className="font-medium mb-2">AI Verification</p>
                  <AIVerification submission={selectedSubmission} />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedSubmission && selectedSubmission.status === "pending" && (
              <>
                <Button variant="outline" onClick={() => handleRejectSubmission()}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button onClick={() => handleApproveSubmission()}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
            {selectedSubmission && selectedSubmission.status !== "pending" && (
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Submission Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmission}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

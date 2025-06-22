"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Trash2, Eye, Filter, ArrowUpDown, Loader2, UserCheck, UserX } from "lucide-react"
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
import { UserForm } from "@/components/admin/UserForm"

interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  status: "active" | "suspended"
  avatar_url?: string
  created_at: string
  city?: string
  points?: number
  last_active?: string
  bio?: string
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<string>("desc")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [confirmStatusUser, setConfirmStatusUser] = useState<User | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [sortField, sortDirection])

  async function fetchUsers() {
    try {
      setLoading(true)
      const query = supabase
        .from("profiles")
        .select("*")
        .order(sortField, { ascending: sortDirection === "asc" })
      const { data, error } = await query
      if (error) throw error
      setUsers((data as User[]) || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error fetching users",
        description: (error && typeof error === 'object' && 'message' in error)
          ? (error as any).message
          : String(error || 'Unknown error'),
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

  const handleUpdateUser = async (formData: Partial<User>) => {
    if (!selectedUser) return
    setActionLoading((prev) => ({ ...prev, [selectedUser.id + '_edit']: true }))
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, update: formData })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Unknown error")
      toast({
        title: "User updated",
        description: "The user has been updated successfully",
      })
      setIsEditDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error updating user",
        description: (error && typeof error === 'object' && 'message' in error)
          ? (error as any).message
          : String(error || 'Unknown error'),
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [selectedUser.id + '_edit']: false }))
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setActionLoading((prev) => ({ ...prev, [selectedUser.id + '_delete']: true }))
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", selectedUser.id)
      if (error) throw error
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error deleting user",
        description: (error && typeof error === 'object' && 'message' in error)
          ? (error as any).message
          : String(error || 'Unknown error'),
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [selectedUser.id + '_delete']: false }))
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    setActionLoading((prev) => ({ ...prev, [user.id + '_status']: true }))
    try {
      const newStatus = user.status === "active" ? "suspended" : "active"
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, update: { status: newStatus } })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Unknown error")
      toast({
        title: `User ${newStatus === "active" ? "activated" : "suspended"}`,
        description: `${user.name} has been ${newStatus === "active" ? "activated" : "suspended"} successfully`,
      })
      setConfirmStatusUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error updating user status",
        description: (error && typeof error === 'object' && 'message' in error)
          ? (error as any).message
          : String(error || 'Unknown error'),
        variant: "destructive",
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [user.id + '_status']: false }))
    }
  }

  const filteredUsers = users.filter(
    (user: User) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user accounts on the platform</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
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
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("created_at")}
                  className="flex items-center p-0 h-auto font-medium"
                >
                  Joined
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
                  <p className="text-sm text-gray-500 mt-2">Loading users...</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-sm text-gray-500">No users found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "outline"}
                      className={
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "active" ? "default" : "outline"}
                      className={
                        user.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {user.status === "active" ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={actionLoading[user.id + '_edit'] || actionLoading[user.id + '_delete'] || actionLoading[user.id + '_status']}>
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
                            setSelectedUser(user)
                            setIsViewDialogOpen(true)
                          }}
                          disabled={actionLoading[user.id + '_edit'] || actionLoading[user.id + '_delete'] || actionLoading[user.id + '_status']}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setIsEditDialogOpen(true)
                          }}
                          disabled={actionLoading[user.id + '_edit'] || actionLoading[user.id + '_delete'] || actionLoading[user.id + '_status']}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setConfirmStatusUser(user)}
                          disabled={actionLoading[user.id + '_edit'] || actionLoading[user.id + '_delete'] || actionLoading[user.id + '_status']}
                        >
                          {user.status === "active" ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="text-red-600"
                          disabled={actionLoading[user.id + '_edit'] || actionLoading[user.id + '_delete'] || actionLoading[user.id + '_status']}
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

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {selectedUser.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex space-x-2 mt-1">
                    <Badge
                      variant={selectedUser.role === "admin" ? "default" : "outline"}
                      className={
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {selectedUser.role === "admin" ? "Admin" : "User"}
                    </Badge>
                    <Badge
                      variant={selectedUser.status === "active" ? "default" : "outline"}
                      className={
                        selectedUser.status === "active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {selectedUser.status === "active" ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{selectedUser.city || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Joined</p>
                  <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Points</p>
                  <p>{selectedUser.points || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Active</p>
                  <p>{selectedUser.last_active || "Unknown"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Bio</p>
                <p className="mt-1">{selectedUser.bio || "No bio provided"}</p>
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user details</DialogDescription>
          </DialogHeader>
          {selectedUser && <UserForm user={selectedUser} onSubmit={handleUpdateUser} />}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Suspend/Activate Dialog */}
      <Dialog open={!!confirmStatusUser} onOpenChange={() => setConfirmStatusUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmStatusUser?.status === "active" ? "Suspend User" : "Activate User"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmStatusUser?.status === "active" ? "suspend" : "activate"} this user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatusUser(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmStatusUser?.status === "active" ? "destructive" : "default"}
              onClick={() => confirmStatusUser && handleToggleUserStatus(confirmStatusUser)}
              disabled={!confirmStatusUser || actionLoading[confirmStatusUser.id + '_status']}
            >
              {confirmStatusUser && actionLoading[confirmStatusUser.id + '_status'] ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {confirmStatusUser?.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

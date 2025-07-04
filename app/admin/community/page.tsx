"use client"

import { useState, useEffect } from "react"
import { Search, Trash2, Eye, Filter, ArrowUpDown, Loader2, MessageSquare, Flag, AlertCircle } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface User {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author?: User;
  likes_count?: number;
  comments_count?: number;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author?: User;
  post_id: string;
  post?: { id: string; title: string };
  created_at: string;
}

interface Report {
  id: string;
  reason: string;
  content_type: string;
  reporter?: User;
  reported_by?: string;
  user_id?: string;
  status: string;
  details?: string;
  created_at: string;
}

interface Errors {
  posts: string | null;
  comments: string | null;
  reports: string | null;
}

export default function CommunityAdmin() {
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc"|"desc">("desc")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isViewPostDialogOpen, setIsViewPostDialogOpen] = useState(false)
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false)
  const [isViewCommentDialogOpen, setIsViewCommentDialogOpen] = useState(false)
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] = useState(false)
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = useState(false)
  const [errors, setErrors] = useState<Errors>({
    posts: null,
    comments: null,
    reports: null,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchCommunityData()
  }, [sortField, sortDirection])

  async function fetchCommunityData() {
    try {
      setLoading(true)
      setErrors({ posts: null, comments: null, reports: null })

      let postsData: Post[] = []
      let postsError: string | null = null

      try {
        const { data, error } = await supabase
          .from("forum_posts")
          .select("*")
          .order(sortField, { ascending: sortDirection === "asc" })

        if (error) throw error
        postsData = (data as Post[]) || []
      } catch (error) {
        console.log("forum_posts table not found, trying alternative...")
        postsError = "Forum posts table not available"
      }

      let commentsData: Comment[] = []
      let commentsError: string | null = null

      try {
        const { data, error } = await supabase
          .from("forum_replies")
          .select("*")
          .order(sortField, { ascending: sortDirection === "asc" })

        if (error) throw error
        commentsData = (data as Comment[]) || []
      } catch (error) {
        console.log("forum_replies table not found, trying alternative...")
        commentsError = "Forum replies table not available"
      }

      let reportsData: Report[] = []
      let reportsError: string | null = null

      try {
        const { data, error } = await supabase
          .from("content_reports")
          .select("*")
          .order(sortField, { ascending: sortDirection === "asc" })

        if (error) throw error
        reportsData = (data as Report[]) || []
      } catch (error) {
        console.log("content_reports table not found")
        reportsError = "Content reports table not available"
      }

      setErrors({
        posts: postsError,
        comments: commentsError,
        reports: reportsError,
      })

      let usersData: User[] = []
      if (postsData.length > 0 || commentsData.length > 0 || reportsData.length > 0) {
        const postAuthorIds = [...new Set(postsData?.map((post) => post.author_id).filter(Boolean) || [])]
        const commentAuthorIds = [...new Set(commentsData?.map((comment) => comment.author_id).filter(Boolean) || [])]
        const reporterIds = [
          ...new Set(reportsData?.map((report) => report.reported_by || report.user_id).filter(Boolean) || []),
        ]

        const allUserIds = [...new Set([...postAuthorIds, ...commentAuthorIds, ...reporterIds])]

        if (allUserIds.length > 0) {
          try {
            const { data: users, error: usersError } = await supabase
              .from("profiles")
              .select("id, name, avatar_url")
              .in("id", allUserIds)

            if (!usersError) {
              usersData = (users as User[]) || []
            }
          } catch (error) {
            console.error("Error fetching user profiles:", JSON.stringify(error, null, 2))
          }
        }
      }

      let postsForComments: { id: string; title: string }[] = []
      if (commentsData.length > 0) {
        const postIds = [...new Set(commentsData?.map((comment) => comment.post_id).filter(Boolean) || [])]
        if (postIds.length > 0) {
          try {
            const { data: posts, error: postsError } = await supabase
              .from("forum_posts")
              .select("id, title")
              .in("id", postIds)

            if (!postsError) {
              postsForComments = (posts as { id: string; title: string }[]) || []
            }
          } catch (error) {
            console.log("Error fetching post titles:", error)
          }
        }
      }

      let likeCounts: Record<string, number> = {};
      const postIds = postsData.map(post => post.id);
      if (postIds.length > 0) {
        const { data: likesData, error: likesError } = await supabase
          .from("forum_likes")
          .select("post_id")
          .in("post_id", postIds)

        if (!likesError && likesData) {
          console.log("Likes data:", likesData);
          // Count likes per post_id
          likeCounts = postIds.reduce((acc, id) => {
            acc[id] = likesData.filter((like: { post_id: string }) => like.post_id === id).length;
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const postsWithAuthors: Post[] =
        postsData?.map((post: Post) => ({
          ...post,
          author: usersData.find((user) => user.id === post.author_id),
          likes_count: likeCounts[post.id] || 0,
        })) || []

      const commentsWithAuthors: Comment[] =
        commentsData?.map((comment: Comment) => ({
          ...comment,
          author: usersData.find((user) => user.id === comment.author_id),
          post: postsForComments.find((post) => post.id === comment.post_id),
        })) || []

      const reportsWithReporters: Report[] =
        reportsData?.map((report: Report) => ({
          ...report,
          reporter: usersData.find((user) => user.id === (report.reported_by || report.user_id)),
        })) || []

      setPosts(postsWithAuthors)
      setComments(commentsWithAuthors)
      setReports(reportsWithReporters)
    } catch (error: unknown) {
      console.error("Error fetching community data:", error)
      toast({
        title: "Error fetching community data",
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

  const handleDeletePost = async () => {
    if (!selectedPost) return
    try {
      const { error } = await supabase.from("forum_posts").delete().eq("id", selectedPost.id)
      if (error) throw error
      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully",
      })
      setIsDeletePostDialogOpen(false)
      fetchCommunityData()
    } catch (error: unknown) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error deleting post",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const handleDeleteComment = async () => {
    if (!selectedComment) return
    try {
      const { error } = await supabase.from("forum_replies").delete().eq("id", selectedComment.id)
      if (error) throw error
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully",
      })
      setIsDeleteCommentDialogOpen(false)
      fetchCommunityData()
    } catch (error: unknown) {
      console.error("Error deleting comment:", error)
      toast({
        title: "Error deleting comment",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const handleResolveReport = async () => {
    if (!selectedReport) return
    try {
      const { error } = await supabase
        .from("content_reports")
        .update({ status: "resolved" })
        .eq("id", selectedReport.id)
      if (error) throw error
      toast({
        title: "Report resolved",
        description: "The report has been marked as resolved",
      })
      setIsViewReportDialogOpen(false)
      fetchCommunityData()
    } catch (error: unknown) {
      console.error("Error resolving report:", error)
      toast({
        title: "Error resolving report",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredComments = comments.filter((comment) =>
    comment.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredReports = reports.filter((report) => report.reason?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">Manage community content and moderation</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search content..."
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

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {errors.posts ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.posts}. The forum posts feature is not yet available. Please ensure the database tables are
                properly set up.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("title")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Title
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("likes_count")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Likes
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("created_at")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Posted
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
                        <p className="text-sm text-gray-500 mt-2">Loading posts...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-sm text-gray-500">No posts found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={post.author?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {post.author?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {post.author?.name || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>{post.likes_count || 0}</TableCell>
                        <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
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
                                  setSelectedPost(post)
                                  setIsViewPostDialogOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPost(post)
                                  setIsDeletePostDialogOpen(true)
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
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          {errors.comments ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.comments}. The forum comments feature is not yet available. Please ensure the database tables
                are properly set up.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("content")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Comment
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("created_at")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Posted
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
                        <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredComments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <p className="text-sm text-gray-500">No comments found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="font-medium">
                          {comment.content.length > 50 ? `${comment.content.substring(0, 50)}...` : comment.content}
                        </TableCell>
                        <TableCell>{comment.post?.title || "Unknown post"}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={comment.author?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {comment.author?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {comment.author?.name || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(comment.created_at).toLocaleDateString()}</TableCell>
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
                                  setSelectedComment(comment)
                                  setIsViewCommentDialogOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedComment(comment)
                                  setIsDeleteCommentDialogOpen(true)
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
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {errors.reports ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.reports}. The content reports feature is not yet available. Please ensure the database tables
                are properly set up.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("reason")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Reason
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Content Type</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("created_at")}
                        className="flex items-center p-0 h-auto font-medium"
                      >
                        Reported
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
                        <p className="text-sm text-gray-500 mt-2">Loading reports...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <p className="text-sm text-gray-500">No reports found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.reason}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              report.content_type === "post"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                            }
                          >
                            {report.content_type === "post" ? "Post" : "Comment"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={report.reporter?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {report.reporter?.name
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("") || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {report.reporter?.name || "Unknown"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={report.status === "pending" ? "default" : "outline"}
                            className={
                              report.status === "pending"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-green-100 text-green-800 hover:bg-green-100"
                            }
                          >
                            {report.status === "pending" ? "Pending" : "Resolved"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
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
                                  setSelectedReport(report)
                                  setIsViewReportDialogOpen(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              {report.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedReport(report)
                                    handleResolveReport()
                                  }}
                                >
                                  <Flag className="mr-2 h-4 w-4" />
                                  Mark as Resolved
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* All the dialog components remain the same */}
      {/* View Post Dialog */}
      <Dialog open={isViewPostDialogOpen} onOpenChange={setIsViewPostDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPost.title}</h3>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={selectedPost.author?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedPost.author?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedPost.author?.name || "Unknown"}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(selectedPost.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <p>{selectedPost.content}</p>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  <span>{selectedPost.comments_count || 0} comments</span>
                </div>
                <div className="flex items-center">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                  >
                    <path
                      d="M7.5 0.875C7.5 0.875 7.25 1.5 7.25 2.75C7.25 4 7.5 4.75 7.5 4.75L11.75 9C11.75 9 12.5 9.75 12.5 10.5C12.5 11.25 11.75 12 11 12C10.25 12 9.5 11.25 9.5 11.25L5.25 7C5.25 7 4.5 6.75 3.25 6.75C2 6.75 1.375 7 1.375 7L6.25 11.875C6.25 11.875 7.75 13.5 9.5 13.5C11.25 13.5 12.75 11.875 12.75 11.875C12.75 11.875 14.125 10.5 14.125 8.75C14.125 7 12.75 5.625 12.75 5.625L8.5 1.375C8.5 1.375 8.25 1.125 8.25 0.875C8.25 0.625 8.5 0.5 8.5 0.5L7.5 0.875Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span>{selectedPost.likes_count || 0} likes</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewPostDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsViewPostDialogOpen(false)
                setIsDeletePostDialogOpen(true)
              }}
            >
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Dialog */}
      <Dialog open={isDeletePostDialogOpen} onOpenChange={setIsDeletePostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeletePostDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePost}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Comment Dialog */}
      <Dialog open={isViewCommentDialogOpen} onOpenChange={setIsViewCommentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">On post: {selectedComment.post?.title || "Unknown post"}</h3>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={selectedComment.author?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedComment.author?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedComment.author?.name || "Unknown"}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(selectedComment.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <p>{selectedComment.content}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewCommentDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsViewCommentDialogOpen(false)
                setIsDeleteCommentDialogOpen(true)
              }}
            >
              Delete Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Dialog */}
      <Dialog open={isDeleteCommentDialogOpen} onOpenChange={setIsDeleteCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={isViewReportDialogOpen} onOpenChange={setIsViewReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge
                    variant="outline"
                    className={
                      selectedReport.content_type === "post"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                    }
                  >
                    {selectedReport.content_type === "post" ? "Post" : "Comment"}
                  </Badge>
                  <Badge
                    variant={selectedReport.status === "pending" ? "default" : "outline"}
                    className={
                      selectedReport.status === "pending"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2"
                        : "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                    }
                  >
                    {selectedReport.status === "pending" ? "Pending" : "Resolved"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">{new Date(selectedReport.created_at).toLocaleDateString()}</div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Reported By</p>
                <div className="flex items-center mt-1">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={selectedReport.reporter?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedReport.reporter?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedReport.reporter?.name || "Unknown"}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Reason</p>
                <p className="mt-1">{selectedReport.reason}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Additional Comments</p>
                <p className="mt-1">{selectedReport.details || "No additional comments provided"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewReportDialogOpen(false)}>
              Close
            </Button>
            {selectedReport && selectedReport.status === "pending" && (
              <Button onClick={handleResolveReport}>Mark as Resolved</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

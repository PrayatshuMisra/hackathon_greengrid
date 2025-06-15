"use client"

import { useState, useEffect } from "react"
import { Search, Trash2, Eye, Filter, ArrowUpDown, Loader2, MessageSquare, Flag } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Author {
  id: string;
  name: string;
  avatar_url?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_id: string;
  author: Author;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  post_id: string;
  author: Author;
  post: {
    title: string;
  };
}

interface Report {
  id: string;
  reason: string;
  details: string;
  content_type: "post" | "comment";
  status: "pending" | "resolved";
  created_at: string;
  user_id: string;
  reporter: Author;
  content_id: string;
  post?: {
    id: string;
    title: string;
  };
}

export default function CommunityAdmin() {
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState("desc")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isViewPostDialogOpen, setIsViewPostDialogOpen] = useState(false)
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false)
  const [isViewCommentDialogOpen, setIsViewCommentDialogOpen] = useState(false)
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] = useState(false)
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchCommunityData()
  }, [sortField, sortDirection, retryCount])

async function fetchCommunityData() {
  try {
    setLoading(true);
    setError(null);

    console.log("Starting to fetch community data...");

    // Fetch data with better error handling
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select(`
          *,
          author:author_id(id, name, avatar_url)
        `)
        .order(sortField, { ascending: sortDirection === "asc" });
      
      if (error) {
        console.error("Posts fetch error:", {
          message: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint
        });
        throw error;
      }
      return data || [];
    };

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`
          *,
          author:author_id(id, name, avatar_url),
          post:post_id(title)
        `)
        .order(sortField, { ascending: sortDirection === "asc" });
      
      if (error) {
        console.error("Comments fetch error:", {
          message: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint
        });
        throw error;
      }
      return data || [];
    };

const fetchReports = async () => {
  try {
    // Attempt 1: Simple count query
    const { count: simpleCount, error: countError } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Count query failed:", countError);
      throw new Error(`Count failed: ${countError.message}`);
    }

    console.log(`Table contains ${simpleCount} reports`);

    // Attempt 2: Minimal data query
    const { data: minimalData, error: minimalError } = await supabase
      .from('content_reports')
      .select('id, reason, created_at')
      .limit(5);

    if (minimalError) {
      console.error("Minimal query failed:", minimalError);
      throw new Error(`Minimal query failed: ${minimalError.message}`);
    }

    console.log("Minimal data success:", minimalData);

    // Attempt 3: Full query
    const { data, error } = await supabase
      .from("content_reports")
      .select(`
        *,
        reporter:user_id(id, name, avatar_url),
        post:content_id(id, title)
      `)
      .order(sortField, { ascending: sortDirection === "asc" });

    if (error) {
      console.error("Full query failed:", {
        ...error,
        stack: new Error().stack
      });
      throw error;
    }

    return data || [];
  } catch (e) {
    const error = e as Error;
    // Capture more error info
    const errorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // Include additional Supabase error properties if they exist
      ...(typeof error === 'object' ? error : {})
    };

    console.error("Complete reports fetch error:", errorInfo);
    throw new Error(`Reports fetch failed: ${error.message}`);
  }
};

    // Execute all queries with individual error handling
    const [postsData, commentsData, reportsData] = await Promise.all([
      fetchPosts().catch(e => {
        console.error("Failed to fetch posts:", e);
        return [];
      }),
      fetchComments().catch(e => {
        console.error("Failed to fetch comments:", e);
        return [];
      }),
      fetchReports().catch(e => {
        console.error("Failed to fetch reports:", e);
        return [];
      })
    ]);

    setPosts(postsData);
    setComments(commentsData);
    setReports(reportsData);

    console.log("Successfully fetched community data:", {
      posts: postsData.length,
      comments: commentsData.length,
      reports: reportsData.length
    });

  } catch (err) {
    const error = err as Error;
    console.error("Error in fetchCommunityData:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    setError(error);
    toast({
      title: "Error fetching community data",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
      action: (
        <Button variant="outline" size="sm" onClick={() => setRetryCount(prev => prev + 1)}>
          Retry
        </Button>
      ),
    });
  } finally {
    setLoading(false);
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
    } catch (err) {
      const error = err as Error
      console.error("Error deleting post:", error)
      toast({
        title: "Error deleting post",
        description: error.message || "Failed to delete post",
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
    } catch (err) {
      const error = err as Error
      console.error("Error deleting comment:", error)
      toast({
        title: "Error deleting comment",
        description: error.message || "Failed to delete comment",
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
    } catch (err) {
      const error = err as Error
      console.error("Error resolving report:", error)
      toast({
        title: "Error resolving report",
        description: error.message || "Failed to resolve report",
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

  const filteredReports = reports.filter((report) => 
    report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.details?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm text-gray-500 mt-2">Loading posts...</p>
                        {error && (
                          <p className="text-sm text-red-500 mt-1">Error: {error.message}</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <p className="text-sm text-gray-500">No posts found</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setRetryCount(prev => prev + 1)}
                        className="mt-2"
                      >
                        Retry
                      </Button>
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
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
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
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
                        {error && (
                          <p className="text-sm text-red-500 mt-1">Error: {error.message}</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredComments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <p className="text-sm text-gray-500">No comments found</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setRetryCount(prev => prev + 1)}
                        className="mt-2"
                      >
                        Retry
                      </Button>
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
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
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
                  <TableHead>Content</TableHead>
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
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm text-gray-500 mt-2">Loading reports...</p>
                        {error && (
                          <p className="text-sm text-red-500 mt-1">Error: {error.message}</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <p className="text-sm text-gray-500">No reports found</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => setRetryCount(prev => prev + 1)}
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.reason}</TableCell>
                      <TableCell>
                        {report.content_type === "post" ? (
                          report.post?.title || "Unknown post"
                        ) : (
                          "Comment"
                        )}
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
        </TabsContent>
      </Tabs>

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

              <div>
                <p className="text-sm font-medium text-gray-500">Reported Content</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  {selectedReport.content_type === "post" ? (
                    <>
                      <p className="font-medium">Post: {selectedReport.post?.title || "Unknown post"}</p>
                      {selectedReport.post?.id && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => {
                            console.log("View post:", selectedReport.post?.id);
                          }}
                        >
                          View Post
                        </Button>
                      )}
                    </>
                  ) : (
                    <p>Comment</p>
                  )}
                </div>
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
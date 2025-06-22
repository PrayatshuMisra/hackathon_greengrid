"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence, Variants } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
const MotionCard = motion(Card)
const MotionDiv = motion.div
const MotionButton = motion(Button)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  MessageSquare,
  Calendar,
  Share2,
  Heart,
  Send,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Pin,
} from "lucide-react";
import { useApp } from "@/app/providers";

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  avatar_url: string;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
};

type Post = {
  category: string;
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  avatar_url: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  reply_count: number;
  like_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  post_count: number;
  created_at: string;
};

type ExpandedPostState = {
  postId: string;
  comments: Comment[];
  newComment: string;
};

export function Community() {
  const { supabase, user } = useApp();
  const { toast } = useToast();
  const [forumPosts, setForumPosts] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [likedComments, setLikedComments] = useState<string[]>([]);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState<ExpandedPostState[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [currentSharedPost, setCurrentSharedPost] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("forum_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setCategories(data);
      if (data.length > 0 && !postCategory) {
        setPostCategory(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description:
          (error as any).message || "Failed to load forum categories",
        variant: "destructive",
      });
    }
  };

  const fetchPostsWithCategoryFilter = async (categoryId?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("forum_posts_with_author")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      console.log("Requested categoryId:", categoryId);
      console.log("Returned posts:", data);

      if (error) throw error;

      if (Array.isArray(data)) {
        setForumPosts(data);
      } else {
        setForumPosts([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          "An error occurred while fetching posts. Please check the console log.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostsWithAdvancedFiltering = async (
    options: {
      categoryId?: string;
      limit?: number;
      offset?: number;
      sortBy?: "created_at" | "like_count" | "reply_count";
      sortOrder?: "asc" | "desc";
    } = {}
  ) => {
    setIsLoading(true);
    try {
      const {
        categoryId,
        limit = 50,
        offset = 0,
        sortBy = "created_at",
        sortOrder = "desc",
      } = options;

      let query = supabase
        .from("forum_posts_with_author")
        .select("*", { count: "exact" })
        .range(offset, offset + limit - 1);

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      query = query
        .order("is_pinned", { ascending: false })
        .order(sortBy, { ascending: sortOrder === "asc" });

      const { data, error, count } = await query;

      if (error) throw error;

      setForumPosts(data);

      console.log(`Total posts: ${count}`);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to load forum posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    fetchPostsWithCategoryFilter(categoryId);
  };
  const fetchLikedContent = async () => {
    if (!user?.id) return;

    try {
 
      const { data: likedPostsData, error: postsError } = await supabase
        .from("forum_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .is("reply_id", null);

      if (postsError) throw postsError;

      const { data: likedCommentsData, error: commentsError } = await supabase
        .from("forum_likes")
        .select("reply_id")
        .eq("user_id", user.id)
        .not("reply_id", "is", null);

      if (commentsError) throw commentsError;

      setLikedPosts(likedPostsData.map((like: { post_id: string }) => like.post_id));
      setLikedComments(likedCommentsData.map((like: { reply_id: string }) => like.reply_id));
    } catch (error) {
      console.error("Error fetching liked content:", error);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .select(`*, profiles(name, avatar_url)`)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const comments = data.map((comment: any) => ({
        ...comment,
        author_name: comment.profiles?.name || "Anonymous",
        avatar_url: comment.profiles?.avatar_url || "/placeholder.svg",
      }));

      setExpandedPosts((prev) => {
        const existing = prev.find((p) => p.postId === postId);
        if (existing) {
          return prev.map((p) =>
            p.postId === postId ? { ...p, comments } : p
          );
        }
        return [...prev, { postId, comments, newComment: "" }];
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to load comments",
        variant: "destructive",
      });
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedPosts((prev) => {
      const isExpanded = prev.some((p) => p.postId === postId);
      if (isExpanded) {
        return prev.filter((p) => p.postId !== postId);
      } else {
        fetchComments(postId);
        return [...prev, { postId, comments: [], newComment: "" }];
      }
    });
  };

  const handleAddComment = async (postId: string) => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "You need to login to comment",
        variant: "destructive",
      });
      return;
    }

    const expandedPost = expandedPosts.find((p) => p.postId === postId);
    if (!expandedPost || !expandedPost.newComment.trim()) return;

    const commentContent = expandedPost.newComment.trim();
    const post = forumPosts.find(p => p.id === postId);

    const tempCommentId = `temp-${Date.now()}`;
    const tempComment = {
      id: tempCommentId,
      post_id: postId,
      author_id: user.id,
      author_name: user.user_metadata?.name || "You",
      avatar_url: user.user_metadata?.avatar_url || "",
      content: commentContent,
      like_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setExpandedPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? {
              ...p,
              comments: [...p.comments, tempComment],
              newComment: "",
            }
          : p
      )
    );

    setForumPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, reply_count: p.reply_count + 1 }
          : p
      )
    );

    try {
      const { data, error } = await supabase
        .from("forum_replies")
        .insert({
          post_id: postId,
          author_id: user.id,
          content: commentContent,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("forum_posts")
        .update({ reply_count: (post?.reply_count || 0) + 1 })
        .eq("id", postId);

      setExpandedPosts((prev) =>
        prev.map((p) =>
          p.postId === postId
            ? {
                ...p,
                comments: p.comments.map((comment) =>
                  comment.id === tempCommentId
                    ? {
                        ...comment,
                        id: data.id,
                        created_at: data.created_at,
                        updated_at: data.updated_at,
                      }
                    : comment
                ),
              }
            : p
        )
      );

      if (post && post.author_id && post.author_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          title: "New Reply on Your Post",
          message: `${user.user_metadata?.name || "A user"} replied to your post '${post.title}'`,
          type: "badge",
          is_read: false,
          data: {
            post_id: postId,
            action: "reply",
            replier_name: user.user_metadata?.name || "A user",
            comment_content: commentContent.substring(0, 50) + (commentContent.length > 50 ? "..." : "")
          },
        });
      }

      toast({
        title: "Comment Added",
        description: "Your comment was posted successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error adding comment:", error);

      setExpandedPosts((prev) =>
        prev.map((p) =>
          p.postId === postId
            ? {
                ...p,
                comments: p.comments.filter((c) => c.id !== tempCommentId),
                newComment: commentContent,
              }
            : p
        )
      );

      setForumPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, reply_count: Math.max(0, p.reply_count - 1) }
            : p
        )
      );

      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {

      const { data: comment, error: fetchError } = await supabase
        .from("forum_replies")
        .select("post_id, like_count")
        .eq("id", commentId)
        .single();

      if (fetchError) throw fetchError;

      const post = forumPosts.find(p => p.id === comment.post_id);

      setExpandedPosts((prev) =>
        prev.map((postState) => ({
          ...postState,
          comments: postState.comments.filter((c) => c.id !== commentId),
        }))
      );

      setForumPosts((prev) =>
        prev.map((p) =>
          p.id === comment.post_id
            ? { ...p, reply_count: Math.max(0, p.reply_count - 1) }
            : p
        )
      );

      const { error: deleteError } = await supabase
        .from("forum_replies")
        .delete()
        .eq("id", commentId);

      if (deleteError) throw deleteError;

      await supabase
        .from("forum_posts")
        .update({ reply_count: Math.max(0, (post?.reply_count || 1) - 1) })
        .eq("id", comment.post_id);

      await supabase
        .from("forum_likes")
        .delete()
        .eq("reply_id", commentId);

      toast({
        title: "Comment Deleted",
        description: "Your comment was removed successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);

      fetchComments(commentId);
      fetchPostsWithCategoryFilter(activeCategory);
      
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "You need to login to like comments",
        variant: "destructive",
      });
      return;
    }

    try {

      const { data: existingLike, error: checkError } = await supabase
        .from("forum_likes")
        .select()
        .eq("user_id", user.id)
        .eq("reply_id", commentId)
        .maybeSingle();

      if (checkError) throw checkError;

      const postId = expandedPosts.find((p) =>
        p.comments.some((c) => c.id === commentId)
      )?.postId;

     
      const comment = expandedPosts
        .find((p) => p.comments.some((c) => c.id === commentId))
        ?.comments.find((c) => c.id === commentId);

      const alreadyLiked = !!existingLike;

      setExpandedPosts((prev) =>
        prev.map((postState) => {
          if (!postState.comments.some((c) => c.id === commentId))
            return postState;

          return {
            ...postState,
            comments: postState.comments.map((c) => {
              if (c.id !== commentId) return c;
              return {
                ...c,
                like_count: alreadyLiked
                  ? Math.max(0, c.like_count - 1)
                  : c.like_count + 1,
              };
            }),
          };
        })
      );

      setLikedComments((prev) =>
        alreadyLiked
          ? prev.filter((id) => id !== commentId)
          : [...prev, commentId]
      );

      if (alreadyLiked) {

        const { error: deleteError } = await supabase
          .from("forum_likes")
          .delete()
          .eq("id", existingLike.id);

        if (deleteError) throw deleteError;

        await supabase
          .from("forum_replies")
          .update({ like_count: Math.max(0, (comment?.like_count || 1) - 1) })
          .eq("id", commentId);

      } else {
 
        const { error: insertError } = await supabase
          .from("forum_likes")
          .insert({
            user_id: user.id,
            reply_id: commentId,
          });

        if (insertError) throw insertError;

        await supabase
          .from("forum_replies")
          .update({ like_count: (comment?.like_count || 0) + 1 })
          .eq("id", commentId);

        if (comment && comment.author_id && comment.author_id !== user.id) {
          const parentPost = forumPosts.find(p => p.id === comment.post_id);
          await supabase.from("notifications").insert({
            user_id: comment.author_id,
            title: "New Like on Your Comment",
            message: `${user.user_metadata?.name || "A user"} liked your comment on '${parentPost?.title || 'a post'}'`,
            type: "badge",
            is_read: false,
            data: {
              post_id: postId,
              comment_id: commentId,
              action: "comment_like",
              liker_name: user.user_metadata?.name || "A user"
            },
          });
        }
      }
    } catch (error) {
      console.error("Error liking comment:", error);

      setExpandedPosts((prev) =>
        prev.map((postState) => {
          if (!postState.comments.some((c) => c.id === commentId))
            return postState;

          return {
            ...postState,
            comments: postState.comments.map((c) => {
              if (c.id !== commentId) return c;
              const comment = postState.comments.find(com => com.id === commentId);
              return {
                ...c,
                like_count: comment?.like_count || 0,
              };
            }),
          };
        })
      );
 
      setLikedComments((prev) => {
        const isLiked = prev.includes(commentId);
        return isLiked ? prev : prev.filter(id => id !== commentId);
      });
      
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string, authorId: string) => {
    if (!user?.id) {
      toast({
        title: "Login Required",
        description: "You need to login to like posts",
        variant: "destructive",
      });
      return;
    }

    const alreadyLiked = likedPosts.includes(postId);
    const post = forumPosts.find(p => p.id === postId);

    setForumPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              like_count: alreadyLiked
                ? Math.max(0, p.like_count - 1)
                : p.like_count + 1,
            }
          : p
      )
    );

    setLikedPosts((prev) =>
      alreadyLiked 
        ? prev.filter((id) => id !== postId) 
        : [...prev, postId]
    );

    try {
      if (alreadyLiked) {

        const { error } = await supabase
          .from("forum_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        await supabase
          .from("forum_posts")
          .update({ like_count: Math.max(0, (post?.like_count || 1) - 1) })
          .eq("id", postId);

      } else {
  
        const { error } = await supabase.from("forum_likes").insert({
          post_id: postId,
          user_id: user.id,
        });

        if (error) throw error;

        await supabase
          .from("forum_posts")
          .update({ like_count: (post?.like_count || 0) + 1 })
          .eq("id", postId);

        if (authorId && authorId !== user.id) {
          await supabase.from("notifications").insert({
            user_id: authorId,
            title: "New Like on Your Post",
            message: `${user.user_metadata?.name || "A user"} liked your post '${post?.title || 'your post'}'`,
            type: "badge",
            is_read: false,
            data: {
              post_id: postId,
              action: "like",
              liker_name: user.user_metadata?.name || "A user"
            },
          });
        }
      }
    } catch (error) {
      console.error("Error handling like:", error);

      setForumPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                like_count: alreadyLiked
                  ? p.like_count + 1
                  : Math.max(0, p.like_count - 1),
              }
            : p
        )
      );
      
      setLikedPosts((prev) =>
        alreadyLiked 
          ? [...prev, postId] 
          : prev.filter((id) => id !== postId)
      );
      
      toast({
        title: "Error",
        description: "Failed to process like. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = async () => {
    if (
      !postTitle.trim() ||
      !postContent.trim() ||
      !user?.id ||
      !postCategory
    ) {
      toast({
        title: "Error",
        description: "Title, content, and category are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("forum_posts").insert({
        title: postTitle,
        content: postContent,
        author_id: user.id,
        category_id: postCategory,
      });

      if (error) throw error;

      toast({
        title: "Post Created",
        description: "Your post was successfully added",
        variant: "success",
      });
      setPostContent("");
      setPostTitle("");
      setNewPostOpen(false);

      fetchPostsWithCategoryFilter(activeCategory);
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: (error as any).message || "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const handleSharePost = async (postId: string, postTitle: string) => {
    const postUrl = `${window.location.origin}/community/post/${postId}`;
    const shareText = `Check out this post: "${postTitle}"`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: shareText,
          url: postUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
        fallbackShare(postUrl, shareText);
      }
    } else {
      fallbackShare(postUrl, shareText);
    }
  };

  const fallbackShare = (url: string, text: string) => {
    setCurrentSharedPost({ id: url.split("/").pop() || "", title: text });
    setShareDialogOpen(true);
  };

  useEffect(() => {
    fetchCategories();
    fetchPostsWithCategoryFilter(activeCategory);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchPostsWithCategoryFilter(activeCategory);
      await fetchLikedContent();
    };
    loadData();

    const postsSubscription = supabase
      .channel("posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_posts" },
        () => fetchPostsWithCategoryFilter(activeCategory)
      )
      .subscribe();

    const likesSubscription = supabase
      .channel("likes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_likes" },
        () => {
          fetchPostsWithCategoryFilter(activeCategory);
          fetchLikedContent();
        }
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel("comments_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_replies" },
        (payload: { new: { post_id: string } }) => {
          if (payload.new?.post_id) {
            fetchComments(payload.new.post_id);
          }
          fetchPostsWithCategoryFilter(activeCategory);
        }
      )
      .subscribe();

    const notificationsSubscription = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload: { new: any }) => {

          if (payload.new) {
            toast({
              title: payload.new.title,
              description: payload.new.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(likesSubscription);
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Header and New Post */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Community Forum</h2>
          <p className="text-green-600">Connect with fellow eco-warriors</p>
        </div>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your eco-journey, ask questions, or start a discussion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title"
                required
              />
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Content"
                rows={4}
                required
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setNewPostOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreatePost}
                >
                  Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer hover:shadow-md transition-all ${
            activeCategory === "all" ? "bg-green-50 border-green-300" : ""
          }`}
          onClick={() => handleCategoryChange("all")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🌍</div>
            <h3 className="font-semibold">All Posts</h3>
            <p className="text-xs text-gray-500 mt-1">
              {forumPosts.length} posts
            </p>
          </CardContent>
        </Card>

        {categories.map((cat) => {
          const postCount = forumPosts.filter(
            (p) => p.category_id === cat.id
          ).length;
          return (
            <Card
              key={cat.id}
              className={`cursor-pointer hover:shadow-md transition-all ${
                activeCategory === cat.id ? "bg-green-50 border-green-300" : ""
              }`}
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                borderColor:
                  activeCategory === cat.id ? cat.color || "#22c55e" : "",
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{cat.icon || "📝"}</div>
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {postCount} post{postCount !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Posts */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeCategory === "all"
              ? "Recent Discussions"
              : categories.find((c) => c.id === activeCategory)?.name ||
                "Posts"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2">Loading posts...</span>
            </div>
          ) : forumPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {activeCategory === "all"
                ? "No posts available"
                : `No posts found in ${
                    categories.find((c) => c.id === activeCategory)?.name ||
                    "this category"
                  }`}
            </div>
          ) : (
            <div className="space-y-4">
              {forumPosts.map((post) => {
                const expandedPost = expandedPosts.find(
                  (p) => p.postId === post.id
                );
                const isExpanded = !!expandedPost;

                return (
                  <div
                    key={post.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-all ${
                      post.is_pinned ? "bg-green-50 border-green-200" : ""
                    }`}
                  >
                    {post.is_pinned && (
                      <div className="text-xs text-green-600 mb-2 flex items-center">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned Post
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={post.avatar_url || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {post.author_name?.[0] ?? "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {post.author_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-300"
                            style={{
                              borderColor: post.category_color || "#22c55e",
                              color: post.category_color || "#22c55e",
                            }}
                          >
                            {post.category_name}
                          </Badge>
                        </div>
                        <h4 className="font-semibold mb-1">{post.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                          {post.content}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <button
                            onClick={() => handleLike(post.id, post.author_id)}
                            className={`flex items-center space-x-1 ${
                              likedPosts.includes(post.id)
                                ? "text-green-600"
                                : "hover:text-green-600"
                            }`}
                          >
                            <Heart
                              className="h-4 w-4"
                              fill={
                                likedPosts.includes(post.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                            <span>{post.like_count}</span>
                          </button>
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center space-x-1 hover:text-blue-600"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>{post.reply_count}</span>
                          </button>
                          <button
                            onClick={() => handleSharePost(post.id, post.title)}
                            className="flex items-center space-x-1 hover:text-gray-600"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments section */}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-medium mb-3">
                          Comments ({expandedPost.comments.length})
                        </h4>

                        {/* Comments list */}
                        <div className="space-y-3 mb-4">
                          {expandedPost.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className={`flex space-x-3 ${
                                comment.id.startsWith("temp-")
                                  ? "opacity-80"
                                  : ""
                              }`}
                            >
                              <Avatar className="h-8 w-8 mt-1">
                                <AvatarImage src={comment.avatar_url} />
                                <AvatarFallback>
                                  {comment.author_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-gray-100 rounded-lg p-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-sm">
                                      {comment.author_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(
                                        comment.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                    {comment.id.startsWith("temp-") && (
                                      <span className="text-xs text-gray-500">
                                        Posting...
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm">
                                    {comment.content}
                                  </p>
                                </div>
                                <div className="flex space-x-3 mt-1 text-xs text-gray-500">
                                  <button
                                    onClick={() =>
                                      setReplyingTo(
                                        replyingTo === comment.id
                                          ? null
                                          : comment.id
                                      )
                                    }
                                    className="hover:text-blue-600"
                                    disabled={comment.id.startsWith("temp-")}
                                  >
                                    Reply
                                  </button>
                                  <button
                                    className="flex items-center space-x-1 hover:text-green-600"
                                    onClick={() =>
                                      handleLikeComment(comment.id)
                                    }
                                    disabled={comment.id.startsWith("temp-")}
                                  >
                                    <Heart 
                                      className="h-3 w-3" 
                                      fill={likedComments.includes(comment.id) ? "currentColor" : "none"}
                                    />
                                    <span>{comment.like_count}</span>
                                  </button>
                                  {comment.author_id === user?.id && (
                                    <button
                                      className="hover:text-red-600"
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
                                      disabled={comment.id.startsWith("temp-")}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>

                                {/* Reply form */}
                                {replyingTo === comment.id && (
                                  <div className="mt-2 ml-4">
                                    <Textarea
                                      placeholder="Write your reply..."
                                      className="mb-2"
                                    />
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleAddComment(post.id)
                                        }
                                      >
                                        Post Reply
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setReplyingTo(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add comment form */}
                        <div className="flex space-x-3">
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage
                              src={
                                user?.user_metadata?.avatar_url ||
                                "/placeholder.svg"
                              }
                            />
                            <AvatarFallback>
                              {user?.user_metadata?.name?.[0] || "Y"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              value={expandedPost.newComment}
                              onChange={(e) =>
                                setExpandedPosts((prev) =>
                                  prev.map((p) =>
                                    p.postId === post.id
                                      ? { ...p, newComment: e.target.value }
                                      : p
                                  )
                                )
                              }
                              placeholder="Add a comment..."
                              className="mb-2"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(post.id)}
                              disabled={
                                !expandedPost.newComment.trim() ||
                                expandedPost.comments.some((c) =>
                                  c.id.startsWith("temp-")
                                )
                              }
                            >
                              Post Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this post</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <button
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `${window.location.origin}/community/post/${currentSharedPost?.id}`
                  )}`,
                  "_blank"
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
            >
              <Facebook className="h-6 w-6 text-blue-600" />
              <span className="mt-2 text-sm">Facebook</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    currentSharedPost?.title || ""
                  )}&url=${encodeURIComponent(
                    `${window.location.origin}/community/post/${currentSharedPost?.id}`
                  )}`,
                  "_blank"
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
            >
              <Twitter className="h-6 w-6 text-blue-400" />
              <span className="mt-2 text-sm">Twitter</span>
            </button>

            <button
              onClick={() =>
                window.open(
                  `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                    `${window.location.origin}/community/post/${currentSharedPost?.id}`
                  )}&title=${encodeURIComponent(
                    currentSharedPost?.title || ""
                  )}`,
                  "_blank"
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
            >
              <Linkedin className="h-6 w-6 text-blue-700" />
              <span className="mt-2 text-sm">LinkedIn</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/community/post/${currentSharedPost?.id}`
                );
                toast({
                  title: "Link Copied",
                  description: "Post link copied to clipboard",
                });
                setShareDialogOpen(false);
              }}
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100"
            >
              <Copy className="h-6 w-6 text-gray-600" />
              <span className="mt-2 text-sm">Copy Link</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span>Upcoming Eco Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: "Community Tree Plantation Drive",
                date: "July 15, 2025",
                location: "Central Park, Delhi",
                organizer: "Green Delhi Initiative",
                participants: 14,
              },
              {
                title: "Plastic-Free Workshop",
                date: "July 18, 2025",
                location: "Online Event",
                organizer: "Zero Waste India",
                participants: 26,
              },
              {
                title: "Solar Energy Awareness Session",
                date: "July 22, 2025",
                location: "Tech Hub, Bangalore",
                organizer: "Renewable Energy Forum",
                participants: 21,
              },
            ].map((event, index) => (
              <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-green-800">{event.title}</h4>
                    <p className="text-sm text-green-600">by {event.organizer}</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {event.participants} in waiting..
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-green-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    toast({
                      title: "Coming Soon!",
                      description: "Stay tuned for event participation.",
                      className:
                        "bg-green-50 text-green-800 border border-green-200 shadow-md rounded-lg p-4",
                    })
                  }
                >
                  Coming Soon!
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

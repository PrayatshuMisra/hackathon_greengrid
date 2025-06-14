"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, MessageSquare, Calendar, Share2, Heart, Send, MapPin } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function Community() {
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [postContent, setPostContent] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [likedPosts, setLikedPosts] = useState<number[]>([])
  const [comments, setComments] = useState<{ [key: number]: string[] }>({})
  const [commentText, setCommentText] = useState("")
  const [postTitle, setPostTitle] = useState("")
  const [postCategory, setPostCategory] = useState("tips")

  const forumCategories = [
    { id: "tips", name: "Tips & Tricks", icon: "💡", posts: 234 },
    { id: "stories", name: "Success Stories", icon: "🎉", posts: 156 },
    { id: "questions", name: "Q&A", icon: "❓", posts: 89 },
    { id: "events", name: "Local Events", icon: "📅", posts: 67 },
  ]

  const [forumPosts, setForumPosts] = useState([
    {
      id: 1,
      author: "EcoEnthusiast",
      avatar: "/placeholder.svg",
      title: "Best composting tips for beginners?",
      content:
        "Just started the home composting challenge. Any tips for getting started? I'm particularly concerned about odors in my apartment.",
      category: "tips",
      replies: 12,
      likes: 24,
      time: "2 hours ago",
    },
    {
      id: 2,
      author: "GreenGuru",
      avatar: "/placeholder.svg",
      title: "Amazing results from plastic-free week!",
      content:
        "Completed the plastic-free challenge and saved 8kg of plastic waste. Here's how I managed shopping, food storage, and daily routines without single-use plastics...",
      category: "stories",
      replies: 8,
      likes: 45,
      time: "5 hours ago",
    },
    {
      id: 3,
      author: "ClimateChampion",
      avatar: "/placeholder.svg",
      title: "How to measure electricity savings accurately?",
      content:
        "I'm participating in the Energy Saver Challenge but I'm not sure how to accurately measure my electricity consumption reduction. Any tools or methods you recommend?",
      category: "questions",
      replies: 15,
      likes: 18,
      time: "1 day ago",
    },
    {
      id: 4,
      author: "EcoOrganizer",
      avatar: "/placeholder.svg",
      title: "Join our weekend tree planting event!",
      content:
        "We're organizing a tree planting event this Saturday at Central Park. We aim to plant 100 native trees. Tools and saplings will be provided. Just bring your enthusiasm!",
      category: "events",
      replies: 32,
      likes: 67,
      time: "2 days ago",
    },
  ])

  const filteredPosts =
    activeCategory === "all" ? forumPosts : forumPosts.filter((post) => post.category === activeCategory)

  const handleLike = (postId: number) => {
    if (likedPosts.includes(postId)) {
      // Unlike
      setLikedPosts((prev) => prev.filter((id) => id !== postId))

      // Update post likes
      setForumPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes - 1 } : post)))
    } else {
      // Like
      setLikedPosts((prev) => [...prev, postId])

      // Update post likes
      setForumPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)))
    }
  }

  const handleComment = (postId: number) => {
    if (!commentText.trim()) return

    // Add comment
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentText],
    }))

    // Update post replies
    setForumPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, replies: post.replies + 1 } : post)))

    // Clear comment text
    setCommentText("")
  }

  const handleShare = (postId: number) => {
    // In a real app, this would open a share dialog
    // For now, we'll simulate copying a link to clipboard

    const shareLink = `${window.location.origin}/community/post/${postId}`
    navigator.clipboard.writeText(shareLink)

    toast({
      title: "Link Copied!",
      description: "Post link has been copied to clipboard.",
      variant: "success",
    })
  }

  const handleCreatePost = () => {
    if (!postContent.trim()) return

    // Create new post
    const newPost = {
      id: forumPosts.length + 1,
      author: "You",
      avatar: "/placeholder.svg",
      title: postTitle,
      content: postContent,
      category: postCategory,
      replies: 0,
      likes: 0,
      time: "Just now",
    }

    // Add post to list
    setForumPosts((prev) => [newPost, ...prev])

    // Close dialog and reset form
    setNewPostOpen(false)
    setPostContent("")
    setPostTitle("")

    // Show success message
    toast({
      title: "Post Created!",
      description: "Your post has been published successfully.",
      variant: "success",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-green-800">Community Forum</h2>
          <p className="text-green-600">Connect with fellow eco-warriors</p>
        </div>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>Share your eco-journey, ask questions, or start a discussion</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  placeholder="Enter a descriptive title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                >
                  {forumCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <Textarea
                  placeholder="Share your thoughts, questions, or experiences..."
                  rows={5}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setNewPostOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreatePost}
                  disabled={!postTitle.trim() || !postContent.trim()}
                >
                  Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Forum Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            activeCategory === "all" ? "border-green-300 bg-green-50" : ""
          }`}
          onClick={() => setActiveCategory("all")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🌍</div>
            <h3 className="font-semibold">All Posts</h3>
            <p className="text-sm text-gray-500">{forumPosts.length} posts</p>
          </CardContent>
        </Card>

        {forumCategories.map((category) => (
          <Card
            key={category.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              activeCategory === category.id ? "border-green-300 bg-green-50" : ""
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">{category.icon}</div>
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.posts} posts</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeCategory === "all"
              ? "Recent Discussions"
              : forumCategories.find((c) => c.id === activeCategory)?.name || "Discussions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{post.author}</span>
                      <span className="text-sm text-gray-500">{post.time}</span>
                      <Badge
                        variant="outline"
                        className={`${
                          post.category === "tips"
                            ? "border-blue-300 text-blue-600"
                            : post.category === "stories"
                              ? "border-green-300 text-green-600"
                              : post.category === "questions"
                                ? "border-purple-300 text-purple-600"
                                : "border-orange-300 text-orange-600"
                        }`}
                      >
                        {forumCategories.find((c) => c.id === post.category)?.name}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1">{post.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button
                        className={`flex items-center space-x-1 ${likedPosts.includes(post.id) ? "text-green-600" : "hover:text-green-600"}`}
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className="h-4 w-4" fill={likedPosts.includes(post.id) ? "currentColor" : "none"} />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-600">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.replies}</span>
                      </button>
                      <button
                        className="flex items-center space-x-1 hover:text-gray-700"
                        onClick={() => handleShare(post.id)}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Comments Section */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {comments[post.id]?.map((comment, i) => (
                    <div key={i} className="text-sm mb-2 pl-2 border-l-2 border-gray-200">
                      <p className="text-gray-700">{comment}</p>
                    </div>
                  ))}
                  <div className="flex mt-2">
                    <Input
                      placeholder="Add a comment..."
                      className="text-sm mr-2"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleComment(post.id)}
                    />
                    <Button size="sm" onClick={() => handleComment(post.id)}>
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Reply */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Input placeholder="Share your thoughts or ask a question..." className="bg-white" />
              <div className="flex justify-end mt-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                date: "Dec 15, 2024",
                location: "Central Park, Delhi",
                organizer: "Green Delhi Initiative",
                participants: 45,
              },
              {
                title: "Plastic-Free Workshop",
                date: "Dec 18, 2024",
                location: "Online Event",
                organizer: "Zero Waste India",
                participants: 128,
              },
              {
                title: "Solar Energy Awareness Session",
                date: "Dec 22, 2024",
                location: "Tech Hub, Bangalore",
                organizer: "Renewable Energy Forum",
                participants: 67,
              },
            ].map((event, index) => (
              <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-green-800">{event.title}</h4>
                    <p className="text-sm text-green-600">by {event.organizer}</p>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {event.participants} joined
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
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Join Event
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

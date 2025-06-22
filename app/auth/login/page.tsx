"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FallingLeavesBackground from "@/components/FallingLeavesBackground";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, Mail, Lock, AlertCircle, Github } from "lucide-react";
import { useApp } from "@/app/providers";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const { supabase } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    localStorage.setItem("greengrid-theme", "light");

    setEmail("demo@greengrid.com");
    setPassword("demo123");
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Login attempt with email:", email);

    try {
      if (email === "demo@greengrid.com" && password === "demo123") {
        console.log("Demo login detected");
        toast({
          title: "Demo Login Successful",
          description: "Welcome to GreenGrid! You're logged in with the demo account.",
          variant: "success",
        });
        setTimeout(() => {
          document.cookie = "demo=true; path=/";
          router.push("/dashboard");
        }, 500);
        return;
      }

      console.log("Attempting Supabase login");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      console.log("Supabase login result:", { data, error });

      if (error) {
        console.error("Supabase login error:", error);
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please check your email and click the verification link before signing in.");
        }
        throw error;
      }

      console.log("Login successful, user data:", data);

      toast({
        title: "Login successful",
        description: "Welcome to GreenGrid!",
        variant: "success",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "github" | "twitter") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "https://hackathon-greengrid.vercel.app/auth/callback",
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || `Failed to sign in with ${provider}`);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast({
        title: "Magic link sent",
        description: "Check your email for the login link!",
        variant: "success",
      });
    } catch (error: any) {
      setError(error.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-b from-green-50 to-blue-100">
      <FallingLeavesBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="w-full max-w-md border-green-200 shadow-xl backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="relative"
                >
                  <Leaf className="h-10 w-10 text-green-600" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-green-400 opacity-20"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              </div>
              <CardTitle className="text-2xl font-bold">Welcome to GreenGrid</CardTitle>
              <CardDescription>
                Sign in to your account to continue your eco journey
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-green-50 p-3 rounded-md border border-green-200"
              >
                <p className="text-sm text-green-800 font-medium">Demo Account</p>
                <p className="text-xs text-green-600">Email: demo@greengrid.com</p>
                <p className="text-xs text-green-600">Password: demo123</p>
              </motion.div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/auth/forgot-password" className="text-xs text-green-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 transition"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </motion.div>
              </form>

              <div className="flex items-center space-x-2">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-400">OR</span>
                <Separator className="flex-1" />
              </div>

              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleMagicLink}
                  disabled={loading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Sign in with Magic Link
                </Button>
              </motion.div>

              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialLogin("github")}
                  disabled={loading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  Sign in with GitHub
                </Button>
              </motion.div>
            </CardContent>

            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-green-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Leaf,
  User,
  Mail,
  Lock,
  AlertCircle,
  Github,
  Twitter,
} from "lucide-react";
import { useApp } from "@/app/providers";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion"; // ✅ Add this line

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState<"Weak" | "Medium" | "Strong" | "">(
    ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { supabase } = useApp();

  const getPasswordStrengthScore = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  useEffect(() => {
    const score = getPasswordStrengthScore(password);
    if (!password) setStrength("");
    else if (score <= 1) setStrength("Weak");
    else if (score === 2) setStrength("Medium");
    else setStrength("Strong");
  }, [password]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error(
            "This email is already registered. Please try logging in instead."
          );
        }
        throw authError;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: email,
          name: name,
          avatar_url: null,
          total_points: 0,
          level: 1,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }

        toast({
          title: "Account created successfully!",
          description: "Please check your email to confirm your account.",
          variant: "success",
        });

        router.push("/auth/login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: "github" | "twitter") => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || `Failed to sign up with ${provider}`);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* 🔵 Animated Eco Background */}
      <div className="absolute inset-0 -z-10">
        <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ecoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="100%" stopColor="#bfdbfe" />
            </linearGradient>
          </defs>
          <path fill="url(#ecoGrad)">
            <animate
              attributeName="d"
              dur="12s"
              repeatCount="indefinite"
              values="
                M0,160 C480,320 960,0 1440,160 L1440,320 L0,320 Z;
                M0,120 C480,280 960,40 1440,120 L1440,320 L0,320 Z;
                M0,160 C480,320 960,0 1440,160 L1440,320 L0,320 Z
              "
            />
          </path>
        </svg>
      </div>

      {/* 🍃 Floating Leaf */}
      <motion.div
        className="absolute top-10 left-10 text-green-600 opacity-80"
        animate={{ y: [0, -10, 0], x: [0, 10, 0], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      >
        <Leaf className="h-10 w-10" />
      </motion.div>

      {/* ✅ Unchanged content below */}
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <Leaf className="h-10 w-10 text-green-600 float-animation" />
              <div className="absolute inset-0 pulse-green rounded-full"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Create an Account
          </CardTitle>
          <CardDescription>
            Join the eco-warrior community and make a difference
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name.."
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
                  minLength={8}
                />
              </div>

              {strength && (
                <>
                  <div className="text-sm font-medium mt-1 text-gray-700">
                    Strength:{" "}
                    <span
                      className={`${
                        strength === "Weak"
                          ? "text-red-500"
                          : strength === "Medium"
                          ? "text-yellow-500"
                          : "text-green-600"
                      }`}
                    >
                      {strength}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength === "Weak"
                          ? "w-1/4 bg-red-500"
                          : strength === "Medium"
                          ? "w-1/2 bg-yellow-500"
                          : "w-full bg-green-600"
                      }`}
                    ></div>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500">
                Use 8+ characters with a mix of letters, numbers & symbols.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="flex items-center space-x-2">
            <Separator className="flex-1" />
            <span className="text-xs text-gray-400">OR</span>
            <Separator className="flex-1" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialSignup("github")}
            disabled={loading}
          >
            <Github className="mr-2 h-4 w-4" />
            Sign Up with GitHub
          </Button>
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-green-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

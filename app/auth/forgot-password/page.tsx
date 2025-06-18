"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useApp } from "@/app/providers";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { supabase } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const handleReset = async () => {
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your inbox",
        description: "Password reset link has been sent.",
        variant: "success",
      });
      router.push("/auth/login");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-blue-100 to-teal-100 p-4 bg-[url('/nature-bg.svg')] bg-cover bg-center">
      <Card className="w-full max-w-md border-green-200 shadow-xl backdrop-blur-sm bg-white/90">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold text-green-800">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleReset}
            disabled={loading}
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

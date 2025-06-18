"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useApp } from "@/app/providers";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { supabase } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdate = async () => {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "You can now log in with your new password.",
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
            Reset Your Password
          </CardTitle>
          <CardDescription>
            Enter your new password to complete the reset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useApp } from "@/app/providers";
import { useRealtime } from "@/lib/realtime";
import {
  Home,
  Target,
  Users,
  Trophy,
  Map,
  Wallet,
  MessageSquare,
  User,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const { user, signOut } = useApp();
  const { notifications } = useRealtime();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentPath = pathname.split("/")[1] || "dashboard";
    setActiveTab(currentPath);
  }, [pathname, setActiveTab]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigation = (item: any) => {
    setActiveTab(item.id);
    router.push(item.href);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
    {
      id: "challenges",
      label: "Challenges",
      icon: Target,
      href: "/challenges",
    },
    { id: "teams", label: "Teams", icon: Users, href: "/teams" },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      href: "/leaderboard",
    },
    { id: "map", label: "Map", icon: Map, href: "/map" },
    { id: "ecowallet", label: "EcoWallet", icon: Wallet, href: "/ecowallet" },
    {
      id: "community",
      label: "Community",
      icon: MessageSquare,
      href: "/community",
    },
  ];

  return (
    <nav className="bg-gradient-to-r from-green-800 via-green-700 to-emerald-600 text-white shadow-lg sticky top-0 z-50">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center space-x-2 cursor-pointer pl-1"
          >
            <div className="relative h-8 w-8 flex items-center justify-center">
              <div className="absolute inset-0 pulse-green rounded-full z-0" />
              <Leaf className="h-6 w-6 z-10 text-white float-animation" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-green-100 dark:from-green-300 dark:via-green-400 dark:to-green-500 bg-clip-text text-transparent">
              GreenGrid
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(item)}
                  className={`flex items-center space-x-2 ${
                    isActive
                      ? "bg-white text-green-800 hover:bg-gray-100"
                      : "text-white hover:bg-yellow-100 hover:text-green-800 dark:hover:bg-yellow-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1">
            <ThemeToggle variant="icon-only" className="ml-1" />
            {/* Notifications */}
            <div className="relative">
              <div className="scale-90">
                <NotificationDropdown />
              </div>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center p-0 border border-black">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="text-white hover:bg-yellow-100 hover:text-green-800 dark:hover:bg-yellow-200 flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Profile</span>
              </Button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg z-50">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100"
                    onClick={() => {
                      router.push("/profile");
                      setIsProfileOpen(false);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-200 dark:border-gray-700 py-4">
            <div className="grid grid-cols-2 gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigation(item)}
                    className={`flex items-center space-x-2 justify-start ${
                      isActive
                        ? "bg-white text-green-800 hover:bg-gray-100"
                        : "text-white hover:bg-yellow-100 hover:text-green-800 dark:hover:bg-yellow-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              {/* Mobile Profile Options */}
              <div className="col-span-2 flex flex-col space-y-1 px-2 text-white pt-2 border-t border-green-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    router.push("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-white hover:bg-yellow-100 hover:text-green-800 dark:hover:bg-yellow-200"
                >
                  View Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-red-500 hover:bg-red-100"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

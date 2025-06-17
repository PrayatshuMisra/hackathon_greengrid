"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  variant?: "default" | "compact" | "icon-only"
  className?: string
}

export function ThemeToggle({ variant = "default", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  if (variant === "icon-only") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={`relative h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 
          bg-white text-black dark:bg-white dark:text-black
          ${className}`}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
      </Button>
    )
  }

  if (variant === "compact") {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          onClick={toggleTheme}
          className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-200 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-white"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              theme === "dark" ? "translate-x-7" : "translate-x-1"
            }`}
          >
            <span className="flex h-full w-full items-center justify-center">
              {theme === "light" ? (
                <Sun className="h-3 w-3 text-yellow-500" />
              ) : (
                <Moon className="h-3 w-3 text-blue-500" />
              )}
            </span>
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className={`relative inline-flex items-center space-x-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {theme === "light" ? "Light" : "Dark"}
      </span>
      <button
        onClick={toggleTheme}
        className="relative inline-flex h-10 w-18 items-center rounded-full bg-gradient-to-r from-green-400 to-green-600 p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:shadow-lg dark:bg-white"
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <span
          className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
            theme === "dark" ? "translate-x-8" : "translate-x-0"
          }`}
        >
          <span className="flex h-full w-full items-center justify-center">
            {theme === "light" ? (
              <Sun className="h-4 w-4 text-yellow-500 transition-transform duration-300 hover:rotate-12" />
            ) : (
              <Moon className="h-4 w-4 text-blue-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </span>
        </span>
      </button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {theme === "light" ? "Switch to dark" : "Switch to light"}
      </span>
    </div>
  )
}

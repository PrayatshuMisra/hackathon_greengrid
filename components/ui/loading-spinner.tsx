"use client"
import { useTheme } from "@/contexts/theme-context"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const { theme } = useTheme()

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-green-600 ${sizeClasses[size]} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function ThemeSkeleton({
  className = "",
  variant = "rectangular",
}: {
  className?: string
  variant?: "rectangular" | "circular" | "text"
}) {
  const variantClasses = {
    rectangular: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  }

  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${variantClasses[variant]} ${className}`} />
}

"use client"

import type React from "react"
import { useTheme } from "@/contexts/theme-context"

interface ThemeAwareCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "green" | "blue" | "orange" | "emerald"
  clickable?: boolean
  onClick?: () => void
}

export function ThemeAwareCard({
  children,
  className = "",
  variant = "default",
  clickable = false,
  onClick,
}: ThemeAwareCardProps) {
  const { theme } = useTheme()

  const getCardClasses = () => {
    const baseClasses = "rounded-lg p-4 transition-all duration-200"
    const clickableClasses = clickable ? "cursor-pointer hover:shadow-lg" : ""

    const variantClasses = {
      default: "theme-card",
      green: "theme-card-green",
      blue: "theme-card-blue",
      orange: "theme-card-orange",
      emerald: "theme-card-emerald",
    }

    return `${baseClasses} ${variantClasses[variant]} ${clickableClasses} ${className}`
  }

  return (
    <div
      className={getCardClasses()}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </div>
  )
}

export function ThemeAwareProgressBar({
  value,
  max = 100,
  className = "",
  showShimmer = false,
}: {
  value: number
  max?: number
  className?: string
  showShimmer?: boolean
}) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={`progress-bg h-2 rounded-full overflow-hidden ${className}`}>
      <div
        className={`progress-fill h-full transition-all duration-500 ${showShimmer ? "shimmer" : ""}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export function ThemeAwareBadge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "info" | "error"
  className?: string
}) {
  const variantClasses = {
    default: "badge",
    success: "badge-success",
    warning: "badge-warning",
    info: "badge-info",
    error: "badge-error",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsAdmin(true)
    }

    checkAdminStatus()
  }, [])

  if (!isAdmin) {
    router.push("/auth/login")
    return null
  }

  return <>{children}</>
}

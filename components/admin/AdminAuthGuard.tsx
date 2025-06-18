"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = () => {
      try {
        const adminSession = localStorage.getItem("admin_session")
        if (adminSession) {
          const session = JSON.parse(adminSession)
          
          if (session.email === "admin@greengrid.com" && session.role === "admin") {
           
            const loginTime = new Date(session.loginTime)
            const now = new Date()
            const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)

            if (hoursDiff < 24) {
              setIsAdmin(true)
              return
            }
          }
        }

        setIsAdmin(false)
        router.push("/admin")
      } catch (error) {
        console.error("Error checking admin status:", error)
        setIsAdmin(false)
        router.push("/admin")
      }
    }

    checkAdminStatus()
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}

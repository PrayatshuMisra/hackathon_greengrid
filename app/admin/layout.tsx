"use client"
import type React from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isLoginPage = pathname === "/admin"

  return (
    <>
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <AdminAuthGuard>
          <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 overflow-auto">{children}</div>
            <Toaster />
          </div>
        </AdminAuthGuard>
      )}
    </>
  )
}

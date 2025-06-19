"use client"

import { useSearchParams } from "next/navigation"
import { CertificatePreview } from "@/components/certificate/CertificatePreview"
import { useApp } from "@/app/providers"

export default function CertificatePage() {
  const { user } = useApp()
  const searchParams = useSearchParams()
  const challenge = searchParams.get("challenge") || "Unknown Challenge"
  const points = parseInt(searchParams.get("points") || "0")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <CertificatePreview
        userName={user?.name || "User"}
        challengeTitle={challenge}
        points={points}
      />
    </div>
  )
}

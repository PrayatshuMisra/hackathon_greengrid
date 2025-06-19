"use client"

import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"

type CertificateProps = {
  userName: string
  challengeTitle: string
  points: number
  date?: string
}

export function CertificatePreview({
  userName,
  challengeTitle,
  points,
  date = new Date().toLocaleDateString(),
}: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    if (!certRef.current) return
    const canvas = await html2canvas(certRef.current)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("landscape", "pt", "a4")
    pdf.addImage(imgData, "PNG", 40, 40, 750, 500)
    pdf.save(`${userName}_certificate.pdf`)
  }

  return (
    <div className="space-y-4">
      {/* Certificate Box */}
      <div
        ref={certRef}
        className="relative w-full border-4 border-green-700 rounded-lg shadow-xl text-center"
        style={{
          maxWidth: "800px",
          margin: "auto",
          padding: "2rem",
          backgroundImage: "url('/leaf-background-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* GreenGrid Logo */}
        <div className="flex items-center justify-center mb-4">
          <div className="bg-green-800 p-3 rounded-full">
            <Leaf className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-green-900 ml-3">GreenGrid</h1>
        </div>

        <h1 className="text-2xl font-bold text-green-800 mb-2 underline">
          Certificate of Achievement
        </h1>
        <p className="text-green-700 mb-2">This is proudly presented to</p>
        <h3 className="text-2xl font-bold text-black mb-4">{userName}</h3>

        <p className="text-green-900 text-lg mb-2 font-semibold">
          for successfully completing the <strong>{challengeTitle}</strong> challenge
        </p>

        <p className="text-gray-600 mb-4">Awarded on {date}</p>
        <p className="text-lg font-semibold text-green-800 mb-6">
          Points Earned: {points}
        </p>

        {/* Signature */}
        <div className="flex flex-col items-center mt-8">
          <img
            src="/signature-greengrid.png"
            alt="GreenGrid Team Signature"
            className="h-16 object-contain"
          />
          <p className="text-xs text-green-700 mt-1">Authorized Signature</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          Download and Share PDF
        </Button>
      </div>
    </div>
  )
}

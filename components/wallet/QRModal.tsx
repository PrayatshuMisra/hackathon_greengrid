"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export function QRModal({
  qrImageSrc,
  onRedeem,
  disabled = false,
  loading = false,
}: {
  qrImageSrc: string
  onRedeem?: () => void
  disabled?: boolean
  loading?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleRedeem = async () => {
    if (onRedeem) {
      await onRedeem()
    }
    setIsOpen(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          disabled={disabled || loading}
          onClick={handleRedeem}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Redeeming...
            </>
          ) : (
            "Redeem"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Image
          src={qrImageSrc}
          alt="QR Code"
          width={200}
          height={200}
          className="mx-auto"
        />
        <p className="text-center text-green-700 mt-2">Scan to claim your reward 🎉</p>
      </DialogContent>
    </Dialog>
  )
}
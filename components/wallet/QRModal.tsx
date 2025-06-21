"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function QRModal({
  rewardName,
  redemptionCode,
  onRedeem,
  disabled = false,
}: {
  rewardName: string
  redemptionCode: string
  onRedeem?: () => void
  disabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  // Generate QR code data with reward information
  const qrData = JSON.stringify({
    reward: rewardName,
    code: redemptionCode,
    timestamp: new Date().toISOString(),
    platform: "GreenGrid"
  })

  // Use a QR code generation service
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          disabled={disabled}
          onClick={() => {
            if (onRedeem) onRedeem()
            setIsOpen(true)
          }}
        >
          Redeem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-green-800">Redeem Reward</h3>
          <div className="bg-white p-4 rounded-lg border">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="mx-auto"
              width={200}
              height={200}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Reward: <span className="font-medium">{rewardName}</span></p>
            <p className="text-sm text-gray-600">Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{redemptionCode}</span></p>
            <p className="text-xs text-green-600">Scan this QR code to claim your reward! 🎉</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
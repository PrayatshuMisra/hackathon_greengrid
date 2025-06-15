"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAI } from "@/lib/ai-verification"
import { Camera, CheckCircle, XCircle, Loader2, Eye, FileText, Zap } from "lucide-react"

interface AIVerificationProps {
  challengeType: string
  onVerificationComplete: (result: any) => void
}

export function AIVerification({ challengeType, onVerificationComplete }: AIVerificationProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { verifyImage, extractTextFromImage } = useAI()

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setVerificationResult(null)

    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(selectedFile)
  }

  const handleVerification = async () => {
    if (!file) return
    setIsVerifying(true)

    try {
      const result = challengeType === "energy-bill" || challengeType === "water-bill"
        ? await extractTextFromImage(file, challengeType)
        : await verifyImage(file, challengeType)

      setVerificationResult(result)
      onVerificationComplete(result)
    } catch (error) {
      console.error("Verification failed:", error)
      setVerificationResult({
        success: false,
        confidence: 0,
        message: "Verification failed. Please try again.",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const getChallengeInstructions = () => {
    const instructions = {
      "plastic-free": "Take a photo of your plastic-free meal or shopping",
      "bike-commute": "Take a photo of yourself with your bicycle",
      composting: "Take a photo of your compost bin or organic waste",
      "plant-growing": "Take a photo of your homegrown plants",
      "energy-bill": "Upload your electricity bill to verify consumption reduction",
      "water-bill": "Upload your water bill to verify usage reduction",
    }
    return instructions[challengeType as keyof typeof instructions] || "Upload proof of your eco-action"
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-green-600" />
          <span>AI Verification</span>
        </CardTitle>
        <CardDescription>{getChallengeInstructions()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-md" />
                <p className="text-sm text-gray-600">Click to change image</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  {challengeType.includes("bill")
                    ? <FileText className="h-12 w-12 text-green-500" />
                    : <Camera className="h-12 w-12 text-green-500" />
                  }
                </div>
                <p className="text-lg font-medium text-gray-700">
                  {challengeType.includes("bill") ? "Upload your bill" : "Take or upload a photo"}
                </p>
                <p className="text-sm text-gray-500">Drag and drop or click to browse</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </div>

        {/* Button */}
        {file && !verificationResult && (
          <Button onClick={handleVerification} disabled={isVerifying} className="w-full bg-green-600 hover:bg-green-700" size="lg">
            {isVerifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying with AI...</> : <><Zap className="h-4 w-4 mr-2" />Verify with AI</>}
          </Button>
        )}

        {/* Progress */}
        {isVerifying && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>AI Analysis in progress...</span>
              <span>Processing</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {/* Result */}
        {verificationResult && (
          <Card className={verificationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {verificationResult.success ? <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" /> : <XCircle className="h-6 w-6 text-red-600 mt-0.5" />}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold ${verificationResult.success ? "text-green-800" : "text-red-800"}`}>
                      {verificationResult.success ? "Verification Successful!" : "Verification Failed"}
                    </h4>
                    <Badge variant={verificationResult.success ? "default" : "destructive"}>
                      {Math.round(verificationResult.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <p className={`text-sm ${verificationResult.success ? "text-green-700" : "text-red-700"}`}>
                    {verificationResult.message}
                  </p>
                  {verificationResult.details && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(verificationResult.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="capitalize">{key.replace("_", " ")}:</span>
                          <span className="font-medium">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
         {/* AI Features Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">AI Verification Features:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Image recognition for eco-actions</li>
            <li>• OCR for bill verification</li>
            <li>• Real-time confidence scoring</li>
            <li>• Fraud detection and validation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

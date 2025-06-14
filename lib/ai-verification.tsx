"use client"

import type React from "react"

import { createContext, useContext } from "react"

interface AIContextType {
  verifyImage: (file: File, challengeType: string) => Promise<any>
  extractTextFromImage: (file: File, documentType: string) => Promise<any>
}

const AIContext = createContext<AIContextType>({
  verifyImage: async () => ({}),
  extractTextFromImage: async () => ({}),
})

export const useAI = () => useContext(AIContext)

export function AIProvider({ children }: { children: React.ReactNode }) {
  const verifyImage = async (file: File, challengeType: string) => {
    // Simulate AI image verification
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const verificationResults = {
      "plastic-free": {
        success: Math.random() > 0.3,
        confidence: 0.85 + Math.random() * 0.15,
        message: "Plastic-free meal detected successfully!",
        details: {
          plastic_items_detected: 0,
          organic_content: "95%",
          verification_method: "TensorFlow.js Object Detection",
        },
      },
      "bike-commute": {
        success: Math.random() > 0.2,
        confidence: 0.9 + Math.random() * 0.1,
        message: "Bicycle commute verified!",
        details: {
          vehicle_type: "Bicycle",
          confidence_score: "92%",
          verification_method: "Teachable Machine Classification",
        },
      },
      composting: {
        success: Math.random() > 0.25,
        confidence: 0.8 + Math.random() * 0.2,
        message: "Compost bin identified with organic waste!",
        details: {
          organic_waste_detected: "Yes",
          compost_stage: "Active decomposition",
          verification_method: "Custom CNN Model",
        },
      },
      "plant-growing": {
        success: Math.random() > 0.15,
        confidence: 0.88 + Math.random() * 0.12,
        message: "Healthy homegrown plants detected!",
        details: {
          plant_health: "Excellent",
          growth_stage: "Mature",
          verification_method: "Plant Recognition AI",
        },
      },
    }

    return (
      verificationResults[challengeType as keyof typeof verificationResults] || {
        success: false,
        confidence: 0.1,
        message: "Unable to verify this challenge type",
      }
    )
  }

  const extractTextFromImage = async (file: File, documentType: string) => {
    // Simulate OCR text extraction
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const ocrResults = {
      "energy-bill": {
        success: Math.random() > 0.2,
        confidence: 0.92,
        message: "Energy consumption reduced by 18%!",
        details: {
          previous_consumption: "450 kWh",
          current_consumption: "369 kWh",
          reduction_percentage: "18%",
          verification_method: "Tesseract.js OCR + Pattern Matching",
        },
      },
      "water-bill": {
        success: Math.random() > 0.25,
        confidence: 0.89,
        message: "Water usage reduced by 22%!",
        details: {
          previous_usage: "12,500 L",
          current_usage: "9,750 L",
          reduction_percentage: "22%",
          verification_method: "Tesseract.js OCR + Data Validation",
        },
      },
    }

    return (
      ocrResults[documentType as keyof typeof ocrResults] || {
        success: false,
        confidence: 0.1,
        message: "Unable to extract data from this document type",
      }
    )
  }

  return (
    <AIContext.Provider
      value={{
        verifyImage,
        extractTextFromImage,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

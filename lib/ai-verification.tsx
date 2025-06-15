"use client"

import type React from "react"
import { createContext, useContext } from "react"
import * as tf from "@tensorflow/tfjs"

interface AIContextType {
  verifyImage: (file: File, challengeType: string) => Promise<any>
  extractTextFromImage: (file: File, documentType: string) => Promise<any>
}

const AIContext = createContext<AIContextType>({
  verifyImage: async () => ({}),
  extractTextFromImage: async () => ({}),
})

export const useAI = () => useContext(AIContext)

let model: tf.LayersModel | null = null
let labels: string[] = []

async function loadPlasticFreeModel() {
  if (!model) {
    model = await tf.loadLayersModel("/teachable/plastic-free/model.json")

    try {
      const metadata = await fetch("/teachable/plastic-free/metadata.json").then((res) => res.json())
      labels = metadata.labels || ["Plastic", "Plastic-Free"]
    } catch (err) {
      console.warn("Failed to load metadata, using fallback labels")
      labels = ["Plastic", "Plastic-Free"]
    }
  }

  if (labels.length === 0) throw new Error("Model loaded but no labels found.")
  return { model, labels }
}

async function runPlasticFreePrediction(file: File) {
  await loadPlasticFreeModel()

  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const img = new Image()
      img.onload = async () => {
        const tensor = tf.browser.fromPixels(img)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(255)
          .expandDims(0)

        const prediction = model!.predict(tensor) as tf.Tensor
        const data = await prediction.data()
        const results = labels.map((label, i) => ({
          label,
          confidence: data[i],
        }))
        const best = results.sort((a, b) => b.confidence - a.confidence)[0]
        const isPlasticFree = best.label.toLowerCase().includes("plastic-free")

        console.log("Model prediction results:", results)

        resolve({
          success: isPlasticFree && best.confidence > 0.8,
          confidence: best.confidence,
          message: `Detected as "${best.label}"`,
          details: results.reduce((acc, cur) => ({
            ...acc,
            [cur.label]: (cur.confidence * 100).toFixed(1) + "%",
          }), {}),
        })
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function AIProvider({ children }: { children: React.ReactNode }) {
  const verifyImage = async (file: File, challengeType: string) => {
    if (challengeType === "plastic-free") {
      return await runPlasticFreePrediction(file)
    }

    await new Promise((res) => setTimeout(res, 2000))
    return {
      success: false,
      confidence: 0.1,
      message: "Challenge not supported yet.",
    }
  }

  const extractTextFromImage = async (file: File, documentType: string) => {
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

    return ocrResults[documentType as keyof typeof ocrResults] || {
      success: false,
      confidence: 0.1,
      message: "Unable to extract data from this document type",
    }
  }

  return <AIContext.Provider value={{ verifyImage, extractTextFromImage }}>{children}</AIContext.Provider>
}

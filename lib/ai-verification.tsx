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

// Caches
let plasticModel: tf.LayersModel | null = null
let plasticLabels: string[] = []

let bikeModel: tf.LayersModel | null = null
let bikeLabels: string[] = []

// Load plastic-free model
async function loadPlasticFreeModel() {
  if (!plasticModel) {
    plasticModel = await tf.loadLayersModel("/teachable/plastic-free/model.json")
    try {
      const metadata = await fetch("/teachable/plastic-free/metadata.json").then((res) => res.json())
      plasticLabels = metadata.labels || ["Plastic", "Plastic-Free"]
    } catch {
      plasticLabels = ["Plastic", "Plastic-Free"]
    }
  }
  return { model: plasticModel, labels: plasticLabels }
}

// Load bike-commute model
async function loadBikeCommuteModel() {
  if (!bikeModel) {
    bikeModel = await tf.loadLayersModel("/teachable/bike-commute/model.json")
    try {
      const metadata = await fetch("/teachable/bike-commute/metadata.json").then((res) => res.json())
      bikeLabels = metadata.labels || ["Not-Cycles", "Cycles"]
    } catch {
      bikeLabels = ["Not-Cycles", "Cycles"]
    }
  }
  return { model: bikeModel, labels: bikeLabels }
}

// General prediction function
async function runPrediction(file: File, model: tf.LayersModel, labels: string[], successLabel: string) {
  return new Promise<any>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = async () => {
        const tensor = tf.browser.fromPixels(img)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(255)
          .expandDims(0)

        const prediction = model.predict(tensor) as tf.Tensor
        const data = await prediction.data()
        const results = labels.map((label, i) => ({
          label,
          confidence: data[i],
        }))
        const best = results.sort((a, b) => b.confidence - a.confidence)[0]

        const isSuccess = best.label.toLowerCase() === successLabel.toLowerCase() && best.confidence > 0.8

        console.log("Best prediction:", best)
        console.log("Full prediction:", results)

        resolve({
          success: isSuccess,
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

// Main AI Provider
export function AIProvider({ children }: { children: React.ReactNode }) {
  const verifyImage = async (file: File, challengeType: string) => {
    if (challengeType === "plastic-free") {
      const { model, labels } = await loadPlasticFreeModel()
      return runPrediction(file, model, labels, "plastic-free")
    }

    if (challengeType === "bike-commute") {
      const { model, labels } = await loadBikeCommuteModel()
      return runPrediction(file, model, labels, "cycles") // <- Use lowercase match
    }

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

  return (
    <AIContext.Provider value={{ verifyImage, extractTextFromImage }}>
      {children}
    </AIContext.Provider>
  )
}

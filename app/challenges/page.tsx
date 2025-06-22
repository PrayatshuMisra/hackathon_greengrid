"use client"
import { Challenges } from "@/components/challenges/Challenges"
import { Navigation } from "@/components/layout/Navigation"
import { Footer } from "@/components/layout/Footer"

export default function ChallengesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50">
      <Navigation activeTab="challenges" setActiveTab={(tab: string) => {}} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grow-animation">
          <Challenges />
        </div>
      </main>

      <Footer />
    </div>
  )
}

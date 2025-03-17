"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="absolute inset-0 bg-black bg-cover bg-center opacity-10"></div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 px-4 text-center">
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="size-16 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <span className="font-bold text-white text-2xl">F</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            FireSafe
          </h1>

          <p className="text-xl text-gray-300 max-w-md mx-auto">
            Real-time air quality monitoring and early fire detection
          </p>
        </div>

        <Button
          onClick={() => router.push("/map")}
          className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/20"
        >
          Try It Out
        </Button>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          System Online
        </div>
      </div>
    </div>
  )
}


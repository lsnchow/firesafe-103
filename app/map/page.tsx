"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { format, subDays, addMinutes } from "date-fns"
import { useDebouncedCallback } from 'use-debounce'

// Add this interface
interface AirQualityPoint {
  lat: number
  lng: number
  value: number
}

interface NewsItem {
  title: string
  description: string
  source: string
  date: string
  url: string
}

// Change the import path
const Map = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [points, setPoints] = useState<AirQualityPoint[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const pointsCacheRef = useRef<Record<string, AirQualityPoint[]>>({})
  
  // Calculate the date range
  const now = new Date()
  now.setSeconds(0) // Round to nearest minute
  now.setMilliseconds(0)
  const sevenDaysAgo = subDays(now, 7)
  
  // Convert dates to minutes for the slider
  const totalMinutes = Math.floor((now.getTime() - sevenDaysAgo.getTime()) / (1000 * 60))
  
  // State for time slider (default to current time)
  const [selectedMinutes, setSelectedMinutes] = useState([totalMinutes])
  
  // Convert selected minutes to date
  const selectedDate = addMinutes(sevenDaysAgo, selectedMinutes[0])
  
  const debouncedUpdatePoints = useDebouncedCallback(async () => {
    try {
      const timeKey = selectedDate.toISOString()
      
      // Check cache first
      if (pointsCacheRef.current[timeKey]) {
        setPoints(pointsCacheRef.current[timeKey])
        return
      }

      setIsLoading(true)
      const response = await fetch('http://localhost:5000/get-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          timestamp: timeKey,
        }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      // Cache the results
      pointsCacheRef.current[timeKey] = data
      setPoints(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }, 300)

  // Add news fetch
  const fetchNews = async () => {
    try {
      const response = await fetch('http://localhost:5000/news')
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setNews(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  // Effect to trigger API call when time changes
  useEffect(() => {
    debouncedUpdatePoints()
  }, [selectedMinutes])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${isScrolled ? "bg-background/80 backdrop-blur-md" : "bg-transparent"}`}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <span className="font-bold text-white">F</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              FireSafe
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Button
              onClick={() => router.push("/")}
              className="text-lg px-8 py-2 h-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/20 mx-5"
            >
              Home
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 pt-16 flex flex-col">
        <div className="flex flex-1">
          {/* Controls Panel */}
          <div className="w-1/3 p-6 border-r border-gray-700">
            <div className="space-y-8">
              {/* Time Slider */}
              <div className="space-y-4">
                <Label>Time Selection</Label>
                <Slider
                  value={selectedMinutes}
                  onValueChange={setSelectedMinutes}
                  min={0}
                  max={totalMinutes}
                  step={1}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Selected Time:</p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "MMM d, yyyy HH:mm")}
                  </p>
                  {isLoading && (
                    <p className="text-sm text-orange-500">Updating map...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="w-2/3 p-6">
            <div className="h-full rounded-xl overflow-hidden border border-gray-700">
              <Map points={points} /> {/* Pass points to Map */}
            </div>
          </div>
        </div>
        
        {/* News Section */}
        <div className="w-full p-6 border-t border-gray-700">
          <h2 className="text-xl font-bold mb-4">Local Fire Alerts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-700 bg-gray-900">
                <h3 className="font-bold text-orange-500">{item.title}</h3>
                <p className="text-sm text-gray-400 mt-2">{item.description}</p>
                <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                  <span>{item.source}</span>
                  <span>{format(new Date(item.date), "MMM d, yyyy")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}


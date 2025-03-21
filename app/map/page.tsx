"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { format, subDays, addMinutes } from "date-fns"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Interface definitions remain the same
interface AirQualityPoint {
  lat: number
  lng: number
  sensor1: number
  sensor2: number
  timestamp?: string
  id: number
}

interface NewsItem {
  title: string
  description: string
  source: string
  date: string
  url: string
}

// Map component import remains the same
const Map = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function Home() {
  // Basic UI state
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Data state
  const [allPoints, setAllPoints] = useState<AirQualityPoint[]>([])
  const [filteredPoints, setFilteredPoints] = useState<AirQualityPoint[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [mappedPoints, setMappedPoints] = useState<{lat: number, lng: number, value: number}[]>([])
  
  // Refs to prevent issues in useEffect
  const firstRenderRef = useRef(true)
  const dataTypeInitializedRef = useRef(false)
  
  // Date calculations
  const now = new Date()
  now.setSeconds(0)
  now.setMilliseconds(0)
  const sevenDaysAgo = subDays(now, 7)
  const totalMinutes = Math.floor((now.getTime() - sevenDaysAgo.getTime()) / (1000 * 60))
  
  // SIMPLIFY: Single state for time selection
  const [currentTimeValue, setCurrentTimeValue] = useState(totalMinutes)
  
  // Compute selected date from current time value
  const selectedDate = addMinutes(sevenDaysAgo, currentTimeValue)
  
  // Simplified utility functions
  const transformPointsForMap = (points: AirQualityPoint[], type: "temperature" | "air-quality") => {
    return points.map(point => ({
      lat: point.lat,
      lng: point.lng,
      value: type === "temperature" ? point.sensor1 : point.sensor2
    }))
  }

  // Simplified filter function
  const filterPointsByTime = (points: AirQualityPoint[], targetTime: Date) => {
    const targetMinute = format(targetTime, "yyyy-MM-dd HH:mm")
    return points.filter(point => {
      if (!point.timestamp) return false
      const pointMinute = point.timestamp.substring(0, 16)
      return pointMinute === targetMinute
    })
  }

  // Data handlers
  const handleDataTypeChange = (value: string) => {
    const newType = value as "temperature" | "air-quality"
    setDataType(newType)
    
    if (filteredPoints.length > 0) {
      setMappedPoints(transformPointsForMap(filteredPoints, newType))
    }
  }

  const handleTimeChange = (values: number[]) => {
    setCurrentTimeValue(values[0])
  }

  // Simplified data loading
  const loadAllPoints = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:5000/get-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toISOString() }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const data = await response.json()
      
      const processedData = data
        .filter((point: any) => point.time)
        .map((point: any) => {
          console.log("Processing point:", point);
          return {
            lat: Number(point.lat),
            lng: Number(point.lng),
            sensor1: Number(point.sensor1),
            sensor2: Number(point.sensor2),
            timestamp: point.time,
            id: Number(point.id)
          };
        })
      
      setAllPoints(processedData)
      setDataLoaded(true)
      
      const filtered = filterPointsByTime(processedData, selectedDate)
      setFilteredPoints(filtered)
      setMappedPoints(transformPointsForMap(filtered, dataType))
    } catch (error) {
      console.error('Error loading points:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  // Load data once on component mount
  useEffect(() => {
    loadAllPoints()
    fetchNews()
    const newsInterval = setInterval(fetchNews, 300000) // Refresh news every 5 minutes
    return () => clearInterval(newsInterval)
  }, []) // Empty dependency array = run once on mount

  // Update filtered points when time or data changes
  useEffect(() => {
    // Skip on first render to avoid duplicate filtering (already done in loadAllPoints)
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    
    // Only filter if we have data
    if (dataLoaded && allPoints.length > 0) {
      const filtered = filterPointsByTime(allPoints, selectedDate)
      setFilteredPoints(filtered)
      setMappedPoints(transformPointsForMap(filtered, dataType))
    }
  }, [currentTimeValue, dataLoaded]) // Only re-run when these change

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Update your dataType state to trigger a rerender when changed
  const [dataType, setDataType] = useState<"temperature" | "air-quality">("air-quality")

  // Add useEffect to handle dataType changes
  useEffect(() => {
    // Run immediately if we have data, regardless of first render status
    if (dataLoaded && filteredPoints.length > 0) {
      setMappedPoints(transformPointsForMap(filteredPoints, dataType))
      dataTypeInitializedRef.current = true
    }
  }, [dataType, filteredPoints, dataLoaded]) // Add dataLoaded as a dependency

  // Inside your Home component, add this state
  const [isLiveMode, setIsLiveMode] = useState(false)

  // Modify the handleLiveButtonClick function to toggle live mode
  const handleLiveButtonClick = () => {
    // Toggle live mode
    if (isLiveMode) {
      // Turn off live mode
      setIsLiveMode(false)
    } else {
      // Turn on live mode
      setIsLiveMode(true)
      setCurrentTimeValue(totalMinutes) // Set to current time
      loadAllPoints() // Reload data immediately
    }
  }

  // Modify the live mode update function to be more intelligent about finding data points
  useEffect(() => {
    if (!isLiveMode) return
    
    // Set up automatic refresh every minute
    const intervalId = setInterval(() => {
      console.log("Live mode: refreshing data...")
      
      // Update to current time
      const newNow = new Date()
      newNow.setSeconds(0)
      newNow.setMilliseconds(0)
      const newSevenDaysAgo = subDays(newNow, 7)
      const newTotalMinutes = Math.floor((newNow.getTime() - newSevenDaysAgo.getTime()) / (1000 * 60))
      
      // First try: Reload all points to get the latest data
      const refreshData = async () => {
        try {
          // Reload data with the current timestamp
          const response = await fetch('http://localhost:5000/get-points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: newNow.toISOString() }),
          })
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
          
          const data = await response.json()
          const processedData = data
            .filter((point: any) => point.time)
            .map((point: any) => ({
              lat: Number(point.lat),
              lng: Number(point.lng),
              sensor1: Number(point.sensor1),
              sensor2: Number(point.sensor2),
              timestamp: point.time,
              id: Number(point.id)
            }))
          
          // Update all points
          setAllPoints(processedData)
          
          // Check if there are points at the current minute
          const filtered = filterPointsByTime(processedData, newNow)
          
          if (filtered.length > 0) {
            // Found points at the current time, update everything
            console.log(`Found ${filtered.length} points at current time: ${format(newNow, "yyyy-MM-dd HH:mm")}`)
            setCurrentTimeValue(newTotalMinutes)
            setFilteredPoints(filtered)
            setMappedPoints(transformPointsForMap(filtered, dataType))
          } else {
            // No points at the exact current time - find the most recent data
            console.log("No points at current time, searching for most recent data...")
            
            // Sort all points by timestamp (most recent first)
            const sortedByTime = [...processedData].sort((a, b) => {
              if (!a.timestamp || !b.timestamp) return 0
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            })
            
            if (sortedByTime.length > 0) {
              // Get the most recent timestamp
              const mostRecentPoint = sortedByTime[0]
              if (mostRecentPoint.timestamp) {
                const mostRecentTime = new Date(mostRecentPoint.timestamp)
                console.log(`Using most recent data from: ${format(mostRecentTime, "yyyy-MM-dd HH:mm")}`)
                
                // Calculate the minutes from sevenDaysAgo to this timestamp
                const minutesSinceStart = Math.floor((mostRecentTime.getTime() - newSevenDaysAgo.getTime()) / (1000 * 60))
                
                // Update the current time to match the most recent data
                setCurrentTimeValue(minutesSinceStart)
                
                // Filter for all points at this specific time
                const pointsAtMostRecentTime = processedData.filter((point: { timestamp: string | number | Date }) => {
                  if (!point.timestamp) return false
                  const pointTime = new Date(point.timestamp)
                  return format(pointTime, "yyyy-MM-dd HH:mm") === format(mostRecentTime, "yyyy-MM-dd HH:mm")
                })
                
                setFilteredPoints(pointsAtMostRecentTime)
                setMappedPoints(transformPointsForMap(pointsAtMostRecentTime, dataType))
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing live data:', error)
        }
      }
      
      refreshData()
    }, 60000) // Every minute
    
    // Cleanup on dismount or when live mode is turned off
    return () => {
      clearInterval(intervalId)
    }
  }, [isLiveMode, dataType])

  // Add this state for node selection
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);

  // Add this function to prepare data for the chart
  const prepareChartData = (nodeId: number | null) => {
    if (!nodeId || !allPoints.length) {
      console.log("No data available - nodeId:", nodeId, "allPoints length:", allPoints.length);
      return [];
    }
    
    // Filter points by the selected node ID
    const nodePoints = allPoints.filter(point => point.id === nodeId);
    console.log(`Found ${nodePoints.length} points for node ID ${nodeId}`);
    
    if (nodePoints.length === 0) {
      return [];
    }
    
    // Sort by timestamp
    const sortedPoints = [...nodePoints].sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Format for the chart
    const chartData = sortedPoints.map(point => ({
      time: point.timestamp ? new Date(point.timestamp) : new Date(),
      formattedTime: point.timestamp ? format(new Date(point.timestamp), "HH:mm") : "",
      temperature: point.sensor1,
      airQuality: point.sensor2
    }));
    
    console.log("Chart data prepared:", chartData);
    return chartData;
  };

  // Add this function to get unique node IDs from points
  const getUniqueNodeIds = () => {
    if (!allPoints.length) return [];
    
    const uniqueIds = [...new Set(allPoints.map(point => point.id))];
    return uniqueIds.sort((a, b) => a - b); // Sort numerically
  };

  // Add this function to generate mock chart data
  const generateMockChartData = () => {
  return [
    { formattedTime: "10:00", temperature: 20, airQuality: 50 },
    { formattedTime: "11:00", temperature: 22, airQuality: 60 },
    { formattedTime: "12:00", temperature: 25, airQuality: 80 },
    { formattedTime: "13:00", temperature: 28, airQuality: 100 },
    { formattedTime: "14:00", temperature: 26, airQuality: 90 },
    { formattedTime: "15:00", temperature: 24, airQuality: 70 }
  ];
};

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
              {/* Time Slider - SIMPLIFIED */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Time Selection</Label>
                  <Button 
                    variant={isLiveMode ? "default" : "outline"}
                    size="sm"
                    onClick={handleLiveButtonClick}
                    className={`transition-all duration-300 ${
                      isLiveMode 
                        ? "bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/50 border-2 border-red-400 " 
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isLiveMode ? (
                        <>
                          <span className="mr-1">🔴</span>
                          LIVE
                        </>
                      ) : (
                        "Go Live"
                      )}
                    </span>
                  </Button>
                </div>
                
                <Slider
                  value={[currentTimeValue]}
                  onValueChange={(values) => {
                    // Turn off live mode if user manually changes time
                    if (isLiveMode) setIsLiveMode(false)
                    handleTimeChange(values)
                  }}
                  min={0}
                  max={totalMinutes}
                  step={1}
                  disabled={isLiveMode} // Disable slider when in live mode
                />
                
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {isLiveMode ? "Live Mode - Auto Updating" : "Selected Time:"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "MMM d, yyyy HH:mm")}
                  </p>
                  {isLoading && (
                    <p className="text-sm text-orange-500">Loading data...</p>
                  )}
                  {dataLoaded && (
                    <p className="text-xs text-gray-400">
                      Showing {filteredPoints.length} of {allPoints.length} total points
                    </p>
                  )}
                </div>
              </div>
              
              {/* Heatmap Control Accordion */}
              <Accordion type="single" defaultValue="heatmap" collapsible className="w-full">
                <AccordionItem value="heatmap">
                  <AccordionTrigger className="text-sm font-medium">
                    Heatmap Visualization
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="data-type">Data Type</Label>
                        <Select 
                          value={dataType} 
                          onValueChange={handleDataTypeChange}
                        >
                          <SelectTrigger id="data-type">
                            <SelectValue placeholder="Select data type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="temperature">Temperature</SelectItem>
                            <SelectItem value="air-quality">Air Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Color Scale</Label>
                        <div className="h-3 w-full rounded-md border border-gray-700 overflow-hidden bg-black">
                          <div className="h-full w-full opacity-100" style={{
                            backgroundImage: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #f97316, #ef4444)'
                          }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>{dataType === "temperature" ? "0°C" : "0 PM2.5"}</span>
                          <span>{dataType === "temperature" ? "25°C" : "150 PM2.5"}</span>
                          <span>{dataType === "temperature" ? "50°C" : "300 PM2.5"}</span>
                        </div>
                      
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-xs text-gray-400">
                          {dataType === "temperature" 
                            ? "Temperature is shown in degrees Celsius" 
                            : "Air quality is shown as PM2.5 concentration"}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Node Data Accordion */}
              <Accordion type="single" collapsible className="w-full mt-4">
                <AccordionItem value="nodeData">
                  <AccordionTrigger className="text-sm font-medium">
                    Node Data Visualization
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="node-selector" className="text-sm font-medium block mb-2">Select Node</Label>
                        <Select 
                          value={selectedNodeId?.toString() || ""}
                          onValueChange={(value) => setSelectedNodeId(Number(value))}
                        >
                          <SelectTrigger id="node-selector">
                            <SelectValue placeholder="Select node" />
                          </SelectTrigger>
                          <SelectContent>
                            {getUniqueNodeIds().map(id => (
                              <SelectItem key={id} value={id.toString()}>
                                Node {id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedNodeId && (
                        <div className="space-y-4 mt-4">
                          <h3 className="text-sm font-medium text-white">
                            Data for Node {selectedNodeId}
                          </h3>
                          
                          <div className="h-80 w-full border border-gray-700 rounded-md p-4 bg-gray-900">
                            {/* Show data count */}
                            <div className="text-xs text-gray-500 mb-2">
                              {prepareChartData(selectedNodeId).length} data points available for Node {selectedNodeId}
                            </div>
                            
                            {/* Chart container */}
                            <div style={{ width: '100%', height: 250 }}>
                              {prepareChartData(selectedNodeId).length > 0 ? (
                                <ResponsiveContainer>
                                  <LineChart
                                    data={prepareChartData(selectedNodeId)}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                  >
                                    
                                    <XAxis dataKey="formattedTime" tick={{ fill: '#aaa' }} />
                                    <YAxis 
                                      yAxisId="left" 
                                      tick={{ fill: '#aaa' }} 
                                      domain={['auto', 'auto']} 
                                      label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#aaa', fontSize: 12 }}
                                    />
                                    <YAxis 
                                      yAxisId="right" 
                                      orientation="right" 
                                      tick={{ fill: '#aaa' }} 
                                      domain={['auto', 'auto']}
                                      label={{ value: 'AQI (PM2.5)', angle: 90, position: 'insideRight', fill: '#aaa', fontSize: 12 }}
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
                                      formatter={(value, name) => [Number(value).toFixed(1), name === "Temperature" ? "°C" : "PM2.5"]} 
                                    />
                                    <Legend wrapperStyle={{ color: '#aaa', paddingTop: '10px' }} />
                                    <Line 
                                      yAxisId="left"
                                      type="monotone" 
                                      dataKey="temperature" 
                                      name="Temperature"
                                      stroke="#ef4444" 
                                      strokeWidth={2}
                                      dot={{ r: 3 }}
                                      activeDot={{ r: 6 }}
                                    />
                                    <Line 
                                      yAxisId="right"
                                      type="monotone" 
                                      dataKey="airQuality" 
                                      name="Air Quality"
                                      stroke="#3b82f6" 
                                      strokeWidth={2}
                                      dot={{ r: 3 }}
                                      activeDot={{ r: 6 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  No data available for this node at the selected time
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-400">
                            Showing temperature and air quality data over time for the selected node.
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Map Container */}
          <div className="w-2/3 p-6">
            <div className="h-full rounded-xl overflow-hidden border border-gray-700">
              <Map 
                key={`map-${dataType}`}
                points={mappedPoints.length > 0 
                  ? mappedPoints 
                  : transformPointsForMap(filteredPoints, dataType)} 
              /> 
            </div>
          </div>
        </div>
        
        {/* News Section */}
        <div className="w-full p-6 border-t border-gray-700">
          <h2 className="text-xl font-bold mb-4">Provincial Climate News Alerts</h2>
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


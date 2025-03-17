"use client"

import { useEffect, useRef } from "react"
import dynamic from 'next/dynamic'
import type { Map as LeafletMap } from "leaflet"

interface AirQualityPoint {
  lat: number
  lng: number
  value: number
}

function MapComponent() {
  const mapRef = useRef<LeafletMap | null>(null)
  const heatLayerRef = useRef<any>(null)

  useEffect(() => {
    // Import Leaflet dynamically only on client side
    const L = require('leaflet')
    require('leaflet/dist/leaflet.css')
    require('leaflet.heat')

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/get-data')
        const data: AirQualityPoint[] = await response.json()

        if (!mapRef.current && typeof window !== 'undefined') {
          mapRef.current = L.map("map").setView([44.2253, -76.4951], 16)

          L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
          }).addTo(mapRef.current)

          const heatData = data.map((point) => [point.lat, point.lng, point.value / 100])
          heatLayerRef.current = L.heatLayer(heatData, {
            radius: 30,
            blur: 20,
            maxZoom: 18,
            gradient: {
              0.2: "#3b82f6",
              0.4: "#22c55e",
              0.6: "#eab308",
              0.7: "#f97316",
              0.8: "#ef4444",
            },
          }).addTo(mapRef.current)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return <div id="map" className="w-full h-[calc(100vh-8rem)]" />
}

// Dynamic import with SSR disabled
const Map = dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
})

export default Map

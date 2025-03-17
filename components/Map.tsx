"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.heat"

declare module 'leaflet' {
  export function heatLayer(latlngs: [number, number, number?][], options?: any): any;
}

interface MapProps {
  points: Array<{
    lat: number
    lng: number
    value: number
  }>
}

export default function Map({ points = [] }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const heatLayerRef = useRef<any>(null)
  
  useEffect(() => {
    if (typeof window === "undefined") return
    
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([44.2253, -76.4951], 16)
      
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(mapRef.current)
    }
    
    // Clean up existing heat layer
    if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
    }
    
    // Only create heat layer if we have points
    if (points.length > 0 && mapRef.current) {
      const heatData = points.map(point => [point.lat, point.lng, point.value / 100])
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
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [points])
  
  return <div id="map" className="w-full h-[calc(100vh-10rem)]" />
}
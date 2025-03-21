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
  
  // Add console log to track when Map renders and with what data
  // Initialize map once
  useEffect(() => {
    if (typeof window === "undefined") return
    
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([44.2253, -76.4951], 16)
      
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
        noWrap: true,
        bounds: [[-90, -180], [90, 180]]
      }).addTo(mapRef.current)
    }

    // Cleanup only on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Empty dependency array - only run once

  // Update heat layer when points change
  useEffect(() => {
    if (!mapRef.current) return
    
    console.log(`Points changed, updating heat layer with ${points.length} points`)
    console.log(`Heat data sample:`, points[0])

    // Clean up existing heat layer
    if (heatLayerRef.current) {
      console.log('Removing existing heat layer')
      mapRef.current.removeLayer(heatLayerRef.current)
    }
    
    // Create new heat layer if we have points
    if (points.length > 0) {
      const minRadius = 20
      const maxRadius = 50
      const minValue = Math.min(...points.map(p => p.value))
      const maxValue = Math.max(...points.map(p => p.value))
      const valueRange = maxValue - minValue

      const scaleRadius = (value: number) => {
        if (valueRange === 0) return minRadius
        const normalized = (value - minValue) / valueRange
        return Math.floor(minRadius + (normalized * (maxRadius - minRadius)))
      }

      const heatData = points.map(point => [point.lat, point.lng, point.value / 100] as [number, number, number])
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: scaleRadius(maxValue),
        blur: 20,
        maxZoom: 16,
        gradient: {
          0.2: "#3b82f6",
          0.4: "#22c55e", 
          0.6: "#eab308",
          0.7: "#f97316",
          0.8: "#ef4444",
        },
      }).addTo(mapRef.current)
    }
  }, [points])
  
  return <div id="map" className="w-full h-[calc(100vh-10rem)]" style={{ background: '#000' }} />
}
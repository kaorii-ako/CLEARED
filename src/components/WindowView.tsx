import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useApp } from '../App'
import { useTimer } from '../hooks/useTimer'

export default function WindowView() {
  const { state, dispatch } = useApp()
  const { formatted } = useTimer()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const [turbulence, setTurbulence] = useState(false)

  const flight = state.flight!
  const { latitude, longitude, baroAltitude, velocity, trueTrack, verticalRate } = flight.state
  const altFL = Math.round(baroAltitude / 30.48)
  const spdKt = Math.round(velocity * 1.94384)

  // Turbulence detection
  useEffect(() => {
    if (Math.abs(verticalRate) > 3) {
      setTurbulence(true)
      const t = setTimeout(() => setTurbulence(false), 2000)
      return () => clearTimeout(t)
    }
  }, [verticalRate])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = new maplibregl.Map({
      container: mapRef.current,
      center: [longitude, latitude],
      zoom: 12,
      pitch: 45,
      bearing: trueTrack,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster',
            source: 'satellite',
          },
        ],
      },
      interactive: false,
      attributionControl: false,
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([longitude, latitude])
      mapInstanceRef.current.setBearing(trueTrack)
    }
  }, [latitude, longitude, trueTrack])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex items-center justify-center"
      style={{ background: 'var(--color-void)' }}
      onClick={() => dispatch({ type: 'TOGGLE_WINDOW_VIEW' })}
    >
      {/* Window frame */}
      <div className="relative" style={{ width: 300, height: 420 }}>
        {/* Outer frame - aluminium */}
        <div
          className="absolute inset-0 rounded-[60px] overflow-hidden"
          style={{
            border: '3px solid #3a3d45',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 40px rgba(0,0,0,0.3)',
            background: 'linear-gradient(135deg, #2a2d35 0%, #1a1d25 100%)',
          }}
        >
          {/* Porthole glass */}
          <div
            className={`absolute inset-[8px] rounded-[52px] overflow-hidden ${turbulence ? 'animate-shake' : ''}`}
          >
            <div ref={mapRef} className="w-full h-full" />

            {/* Vignette overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
              }}
            />
          </div>
        </div>

        {/* HUD overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div
            className="text-center text-[10px] tracking-wider px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(8,9,13,0.7)',
              color: 'var(--color-accent-amber)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            FL{String(altFL).padStart(3, '0')} · {spdKt} KT · {formatted}
          </div>
        </div>

        {/* Turbulence indicator */}
        {turbulence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
          >
            <div
              className="text-[9px] tracking-wider px-2 py-1 rounded-full"
              style={{
                background: 'rgba(192,57,43,0.8)',
                color: 'white',
                fontFamily: 'var(--font-mono)',
              }}
            >
              TURBULENCE
            </div>
          </motion.div>
        )}
      </div>

      {/* Tap to return hint */}
      <div className="absolute bottom-4 text-[9px] text-text-muted tracking-wider" style={{ fontFamily: 'var(--font-mono)' }}>
        TAP TO RETURN TO MAP
      </div>
    </motion.div>
  )
}

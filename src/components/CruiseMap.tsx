import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useApp } from '../App'
import { useTimer } from '../hooks/useTimer'
import { useFlight } from '../hooks/useFlight'
import { greatCirclePoints } from '../lib/geo'
import type { MapStyle } from '../types'

const TILE_URLS: Record<MapStyle, string> = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  classic: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
}

const TILE_ATTRIBUTIONS: Record<MapStyle, string> = {
  dark: '© CartoDB',
  satellite: '© Esri',
  classic: '© OpenStreetMap',
}

export default function CruiseMap() {
  const { state, dispatch } = useApp()
  const { formatted, progress } = useTimer()
  useFlight()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const flight = state.flight!
  const { latitude, longitude, baroAltitude, velocity, trueTrack, squawk } = flight.state
  const altFL = Math.round(baroAltitude / 30.48)
  const spdKt = Math.round(velocity * 1.94384)
  const distKm = Math.round(flight.remainingKm)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const savedStyle = (localStorage.getItem('cleared:mapStyle') as MapStyle) || state.mapStyle
    const tileUrl = TILE_URLS[savedStyle]

    const map = new maplibregl.Map({
      container: mapRef.current,
      center: [longitude, latitude],
      zoom: 5,
      pitch: 45,
      bearing: trueTrack,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: TILE_ATTRIBUTIONS[savedStyle],
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      interactive: false,
      attributionControl: false,
    })

    map.on('load', () => setMapReady(true))

    // Aircraft marker
    const el = document.createElement('div')
    el.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#e8a020" style="transform: rotate(${trueTrack}deg); filter: drop-shadow(0 0 6px rgba(232,160,32,0.6));">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    `
    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map)

    // Destination marker
    const destEl = document.createElement('div')
    destEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16">
        <polygon points="8,0 16,8 8,16 0,8" fill="#f0c040" opacity="0.8"/>
      </svg>
    `
    new maplibregl.Marker({ element: destEl })
      .setLngLat([flight.arrivalCoords[1], flight.arrivalCoords[0]])
      .addTo(map)

    // Flight path arc
    const arcPoints = greatCirclePoints(
      [latitude, longitude],
      [flight.arrivalCoords[0], flight.arrivalCoords[1]],
      60
    )
    const arcCoords = arcPoints.map(([lat, lon]) => [lon, lat]) as [number, number][]

    map.on('load', () => {
      map.addSource('flight-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: arcCoords,
          },
          properties: {},
        },
      })
      map.addLayer({
        id: 'flight-path-line',
        type: 'line',
        source: 'flight-path',
        paint: {
          'line-color': '#4dc9e6',
          'line-width': 2,
          'line-dasharray': [4, 3],
          'line-opacity': 0.7,
        },
      })
    })

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update marker position
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat([longitude, latitude])
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([longitude, latitude])
      mapInstanceRef.current.setBearing(trueTrack)
    }
  }, [latitude, longitude, trueTrack])

  function cycleMapStyle() {
    const styles: MapStyle[] = ['dark', 'satellite', 'classic']
    const current = state.mapStyle
    const next = styles[(styles.indexOf(current) + 1) % styles.length]
    dispatch({ type: 'SET_MAP_STYLE', style: next })
    localStorage.setItem('cleared:mapStyle', next)

    // Update tile source
    const map = mapInstanceRef.current
    if (map) {
      const tileUrl = TILE_URLS[next]
      const source = map.getSource('osm') as maplibregl.RasterSource
      if (source) {
        source.setUrl(tileUrl)
        source.setAttribution(TILE_ATTRIBUTIONS[next])
      }
    }
  }

  const styleIcons: Record<MapStyle, string> = {
    dark: '🌍',
    satellite: '🛰',
    classic: '🗺',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full"
      style={{ background: 'var(--color-void)' }}
    >
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Map style toggle */}
      <div className="absolute top-10 right-3 z-10 flex flex-col gap-1">
        {(['dark', 'satellite', 'classic'] as MapStyle[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              dispatch({ type: 'SET_MAP_STYLE', style: s })
              localStorage.setItem('cleared:mapStyle', s)
            }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all"
            style={{
              background: state.mapStyle === s ? 'var(--color-accent-amber)' : 'rgba(0,0,0,0.6)',
              color: state.mapStyle === s ? 'var(--color-void)' : 'white',
            }}
          >
            {styleIcons[s]}
          </button>
        ))}
      </div>

      {/* Top strip */}
      <div className="absolute top-10 left-3 right-14 z-10 flex items-center justify-between">
        <div className="text-[10px] tracking-wider px-2 py-1 rounded-lg" style={{
          background: 'rgba(0,0,0,0.6)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-mono)',
        }}>
          {state.task?.substring(0, 20) || 'FOCUS'}
        </div>
        <div className="px-2 py-1 rounded-lg" style={{
          background: 'rgba(0,0,0,0.6)',
          fontFamily: 'var(--font-mono)',
        }}>
          <span className="text-[9px] tracking-wider text-text-muted">CRUISING</span>
          <span className="text-[11px] ml-2 font-semibold" style={{ color: 'var(--color-accent-amber)' }}>
            {formatted}
          </span>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-3">
        <div className="rounded-xl p-3" style={{ background: 'rgba(8,9,13,0.9)' }}>
          {/* Row 1: Alt, Speed, Distance */}
          <div className="grid grid-cols-3 gap-2 text-center mb-2">
            <div>
              <div className="text-[9px] tracking-wider text-text-muted">ALT</div>
              <div className="text-sm font-bold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                FL{String(altFL).padStart(3, '0')}
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-wider text-text-muted">SPD</div>
              <div className="text-sm font-bold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {spdKt} KT
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-wider text-text-muted">DIST</div>
              <div className="text-sm font-bold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {distKm.toLocaleString()} KM
              </div>
            </div>
          </div>

          {/* Row 2: Callsign, Type, Squawk */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[9px] tracking-wider text-text-muted">CALL</div>
              <div className="text-[11px] font-bold" style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {flight.state.callsign}
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-wider text-text-muted">TYPE</div>
              <div className="text-[11px] font-bold" style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {flight.state.icao24.substring(4).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-[9px] tracking-wider text-text-muted">XPDR</div>
              <div className="text-[11px] font-bold" style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}>
                {squawk}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 rounded-full" style={{ background: 'var(--color-border-faint)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress * 100}%`,
                background: 'var(--color-accent-amber)',
              }}
            />
          </div>
        </div>

        {/* Window view toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_WINDOW_VIEW' })}
          className="absolute bottom-20 right-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--color-border-faint)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-text-primary)">
            <ellipse cx="12" cy="12" rx="10" ry="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

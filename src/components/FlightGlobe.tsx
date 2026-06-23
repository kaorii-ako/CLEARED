import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import { fetchCruisingFlights, fetchFlightRoute } from '../lib/opensky'
import { resolveFlightDuration } from '../lib/flightDuration'
import { latLonToSVG } from '../lib/geo'
import { lookupAirline } from '../lib/callsign'
import type { AircraftState, ResolvedFlight } from '../types'

const MAP_W = 380
const MAP_H = 340
const TAG_RADIUS = 80

export default function FlightGlobe() {
  const { dispatch } = useApp()
  const [loading, setLoading] = useState(true)
  const [flights, setFlights] = useState<ResolvedFlight[]>([])
  const [selectedDuration, setSelectedDuration] = useState(120)
  const [radarAngle, setRadarAngle] = useState(0)

  useEffect(() => {
    let angle = 0
    const iv = setInterval(() => {
      angle = (angle + 2) % 360
      setRadarAngle(angle)
    }, 30)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const cruising = await fetchCruisingFlights()
        if (cancelled) return

        const sampled = cruising
          .sort(() => Math.random() - 0.5)
          .slice(0, 12)

        const resolved: ResolvedFlight[] = []
        for (const aircraft of sampled) {
          if (cancelled) return
          const route = await fetchFlightRoute(aircraft.icao24)
          if (route.arrival) {
            const flight = resolveFlightDuration(aircraft, route.arrival, route.departure)
            if (flight) resolved.push(flight)
          }
        }

        if (!cancelled) {
          setFlights(resolved)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    return flights.filter((f) => {
      const diff = Math.abs(f.remainingMs / 60000 - selectedDuration)
      return diff <= 20
    }).slice(0, 3)
  }, [flights, selectedDuration])

  const displayFlights = filtered.length > 0 ? filtered : flights.slice(0, 3)

  function handleSelect(flight: ResolvedFlight) {
    dispatch({ type: 'SET_FLIGHT', flight })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col"
      style={{ background: 'var(--color-void)' }}
    >
      {/* Globe area */}
      <div className="relative" style={{ height: MAP_H }}>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-full"
          style={{ background: 'var(--color-globe-base)' }}
        >
          {/* Simplified world map - continent outlines */}
          <WorldMapSVG />

          {/* Radar sweep */}
          {!loading && (
            <defs>
              <radialGradient id="radar" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--color-accent-amber)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--color-accent-amber)" stopOpacity="0" />
              </radialGradient>
            </defs>
          )}
          {!loading && (
            <g transform={`rotate(${radarAngle} ${MAP_W / 2} ${MAP_H / 2})`}>
              <line
                x1={MAP_W / 2}
                y1={MAP_H / 2}
                x2={MAP_W / 2 + 160}
                y2={MAP_H / 2}
                stroke="var(--color-accent-amber)"
                strokeWidth="1"
                opacity="0.6"
              />
            </g>
          )}

          {/* Destination tags */}
          {!loading &&
            flights.map((f, i) => {
              const [x, y] = latLonToSVG(
                f.arrivalCoords[0],
                f.arrivalCoords[1],
                MAP_W,
                MAP_H
              )
              const airline = lookupAirline(f.state.callsign)
              return (
                <g key={f.state.icao24 + i}>
                  <motion.g
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.4 }}
                    onClick={() => handleSelect(f)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - 20}
                      y={y - 10}
                      width={40}
                      height={20}
                      rx={10}
                      fill="var(--color-tag-bg)"
                      stroke="var(--color-tag-amber)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={x}
                      y={y + 4}
                      textAnchor="middle"
                      fill="var(--color-tag-amber)"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      fontWeight="600"
                    >
                      ✈ {f.arrivalICAO}
                    </text>
                  </motion.g>
                </g>
              )
            })}

          {/* Loading state */}
          {loading && (
            <g>
              <text
                x={MAP_W / 2}
                y={MAP_H / 2}
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize="11"
                fontFamily="var(--font-mono)"
                letterSpacing="2"
              >
                SCANNING AIRSPACE…
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Duration filter */}
      <div className="flex-1 px-4 pt-3 pb-2 flex flex-col">
        <div className="text-[10px] tracking-[3px] text-text-muted mb-2 text-center"
          style={{ fontFamily: 'var(--font-mono)' }}>
          FOCUS DURATION
        </div>

        {/* Slider */}
        <div className="relative mb-4">
          <input
            type="range"
            min={20}
            max={720}
            step={10}
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-accent-amber) ${((selectedDuration - 20) / 700) * 100}%, var(--color-border-faint) ${((selectedDuration - 20) / 700) * 100}%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>20m</span>
            <span className="text-[11px] text-accent-amber font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
              {selectedDuration >= 60 ? `${Math.floor(selectedDuration / 60)}h ${selectedDuration % 60}m` : `${selectedDuration}m`}
            </span>
            <span className="text-[9px] text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>12h</span>
          </div>
        </div>

        {/* Flight cards */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          <AnimatePresence>
            {displayFlights.map((f, i) => {
              const airline = lookupAirline(f.state.callsign)
              const mins = Math.round(f.remainingMs / 60000)
              return (
                <motion.button
                  key={f.state.icao24}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSelect(f)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                  style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border-faint)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: airline.color, color: '#fff' }}
                  >
                    {f.state.callsign.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {f.arrivalCity}
                    </div>
                    <div className="text-[10px] text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                      {f.arrivalICAO} · {airline.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {mins}m
                    </div>
                    <div className="text-[9px] text-text-muted">remaining</div>
                  </div>
                </motion.button>
              )
            })}
          </AnimatePresence>

          {displayFlights.length === 0 && !loading && (
            <div className="text-center text-text-muted text-xs py-8">
              No flights found near {selectedDuration}m. Adjust the slider.
            </div>
          )}
        </div>

        {/* Book my flight */}
        {displayFlights.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(displayFlights[0])}
            className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider mt-2"
            style={{
              background: 'var(--color-accent-amber)',
              color: 'var(--color-void)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            BOOK MY FLIGHT
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

function WorldMapSVG() {
  return (
    <g opacity="0.4">
      {/* Simplified continent blobs */}
      {/* North America */}
      <path d="M60,80 L90,60 L130,55 L150,70 L140,90 L130,110 L110,130 L90,140 L70,130 L55,110 Z" fill="var(--color-globe-land)" />
      {/* South America */}
      <path d="M110,170 L120,160 L130,170 L135,200 L130,240 L120,260 L110,250 L105,220 L100,190 Z" fill="var(--color-globe-land)" />
      {/* Europe */}
      <path d="M180,60 L210,55 L230,60 L240,75 L230,90 L210,95 L190,90 L180,75 Z" fill="var(--color-globe-land)" />
      {/* Africa */}
      <path d="M190,110 L220,105 L240,120 L245,160 L235,200 L215,210 L195,200 L185,160 L180,130 Z" fill="var(--color-globe-land)" />
      {/* Asia */}
      <path d="M240,50 L300,40 L340,55 L350,80 L340,100 L310,110 L280,105 L260,95 L240,80 Z" fill="var(--color-globe-land)" />
      {/* Australia */}
      <path d="M310,180 L340,175 L355,185 L350,200 L330,210 L310,205 L305,190 Z" fill="var(--color-globe-land)" />
      {/* Grid lines */}
      {[0, 60, 120, 180, 240, 300, 360].map((x) => (
        <line key={`v${x}`} x1={(x / 360) * MAP_W} y1={0} x2={(x / 360) * MAP_W} y2={MAP_H} stroke="var(--color-globe-land)" strokeWidth="0.3" opacity="0.3" />
      ))}
      {[0, 45, 90, 135, 180].map((y) => (
        <line key={`h${y}`} x1={0} y1={(y / 180) * MAP_H} x2={MAP_W} y2={(y / 180) * MAP_H} stroke="var(--color-globe-land)" strokeWidth="0.3" opacity="0.3" />
      ))}
    </g>
  )
}

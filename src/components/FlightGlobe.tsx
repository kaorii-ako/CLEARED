import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import { fetchCruisingFlights, fetchFlightRoute } from '../lib/opensky'
import { resolveFlightDuration } from '../lib/flightDuration'
import { latLonToSVG } from '../lib/geo'
import { lookupAirline } from '../lib/callsign'
import type { ResolvedFlight } from '../types'

const MAP_W = 380
const MAP_H = 340

export default function FlightGlobe() {
  const { dispatch } = useApp()
  const [loading, setLoading] = useState(true)
  const [flights, setFlights] = useState<ResolvedFlight[]>([])
  const [selectedDuration, setSelectedDuration] = useState(120)
  const [radarAngle, setRadarAngle] = useState(0)
  const [hoveredFlight, setHoveredFlight] = useState<string | null>(null)

  useEffect(() => {
    let angle = 0
    const iv = setInterval(() => {
      angle = (angle + 1.5) % 360
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
          .slice(0, 15)

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
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full h-full">
          <defs>
            <radialGradient id="globe-glow" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="#1a2540" stopOpacity="1" />
              <stop offset="100%" stopColor="#08090d" stopOpacity="1" />
            </radialGradient>
            <radialGradient id="radar-sweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent-amber)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--color-accent-amber)" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width={MAP_W} height={MAP_H} fill="url(#globe-glow)" />

          {/* Grid lines */}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`v${i}`} x1={(i / 6) * MAP_W} y1={0} x2={(i / 6) * MAP_W} y2={MAP_H}
              stroke="#1a2035" strokeWidth="0.5" opacity="0.4" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i / 4) * MAP_H} x2={MAP_W} y2={(i / 4) * MAP_H}
              stroke="#1a2035" strokeWidth="0.5" opacity="0.4" />
          ))}

          {/* Continents */}
          <WorldContinents />

          {/* Radar sweep */}
          {!loading && (
            <g transform={`rotate(${radarAngle} ${MAP_W / 2} ${MAP_H / 2})`}>
              <path
                d={`M${MAP_W / 2},${MAP_H / 2} L${MAP_W / 2},${MAP_H / 2 - 170} A170,170 0 0,1 ${MAP_W / 2 + 170 * Math.cos(Math.PI / 6)},${MAP_H / 2 - 170 * Math.sin(Math.PI / 6)} Z`}
                fill="url(#radar-sweep)"
              />
              <line
                x1={MAP_W / 2} y1={MAP_H / 2}
                x2={MAP_W / 2} y2={MAP_H / 2 - 170}
                stroke="var(--color-accent-amber)"
                strokeWidth="1"
                opacity="0.7"
              />
            </g>
          )}

          {/* Radar circles */}
          {!loading && [50, 100, 150].map((r) => (
            <circle key={r} cx={MAP_W / 2} cy={MAP_H / 2} r={r}
              fill="none" stroke="#1a2035" strokeWidth="0.5" opacity="0.3" />
          ))}

          {/* Destination tags */}
          {!loading && flights.map((f, i) => {
            const [x, y] = latLonToSVG(f.arrivalCoords[0], f.arrivalCoords[1], MAP_W, MAP_H)
            const isHovered = hoveredFlight === f.state.icao24
            return (
              <motion.g
                key={f.state.icao24 + i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4, type: 'spring' }}
                onMouseEnter={() => setHoveredFlight(f.state.icao24)}
                onMouseLeave={() => setHoveredFlight(null)}
                onClick={() => handleSelect(f)}
                className="cursor-pointer"
                filter={isHovered ? 'url(#glow)' : undefined}
              >
                <rect
                  x={x - 22} y={y - 10} width={44} height={20} rx={10}
                  fill={isHovered ? 'rgba(240,192,64,0.25)' : 'rgba(240,192,64,0.12)'}
                  stroke="var(--color-tag-amber)"
                  strokeWidth={isHovered ? 1 : 0.5}
                />
                <text
                  x={x} y={y + 4} textAnchor="middle"
                  fill="var(--color-tag-amber)" fontSize="8.5"
                  fontFamily="var(--font-mono)" fontWeight="600"
                >
                  ✈ {f.arrivalICAO}
                </text>
                {isHovered && (
                  <text x={x} y={y + 18} textAnchor="middle"
                    fill="var(--color-text-muted)" fontSize="7"
                    fontFamily="var(--font-mono)">
                    {Math.round(f.remainingMs / 60000)}m
                  </text>
                )}
              </motion.g>
            )
          })}

          {/* Loading */}
          {loading && (
            <g>
              <text x={MAP_W / 2} y={MAP_H / 2 - 10} textAnchor="middle"
                fill="var(--color-text-muted)" fontSize="10"
                fontFamily="var(--font-mono)" letterSpacing="3">
                SCANNING AIRSPACE
              </text>
              <text x={MAP_W / 2} y={MAP_H / 2 + 10} textAnchor="middle"
                fill="var(--color-accent-amber)" fontSize="8"
                fontFamily="var(--font-mono)">
                {flights.length > 0 ? `${flights.length} FLIGHTS FOUND` : 'CONNECTING TO OPENSKY…'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Duration filter */}
      <div className="flex-1 px-4 pt-2 pb-2 flex flex-col">
        <div className="text-[10px] tracking-[3px] text-text-muted mb-2 text-center"
          style={{ fontFamily: 'var(--font-mono)' }}>
          FOCUS DURATION
        </div>

        {/* Slider */}
        <div className="relative mb-3">
          <input
            type="range"
            min={20}
            max={720}
            step={10}
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-accent-amber) ${((selectedDuration - 20) / 700) * 100}%, rgba(255,255,255,0.06) ${((selectedDuration - 20) / 700) * 100}%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>20m</span>
            <span className="text-[12px] font-bold" style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}>
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
                  transition={{ delay: i * 0.08 }}
                  onClick={() => handleSelect(f)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-left"
                  style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border-faint)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: airline.color }}
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
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
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
              No flights found near {selectedDuration}m. Try adjusting the slider.
            </div>
          )}
        </div>

        {/* Book my flight */}
        {displayFlights.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(displayFlights[0])}
            className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider mt-2 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #e8a020, #f0c040)',
              color: 'var(--color-void)',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 4px 20px rgba(232,160,32,0.3)',
            }}
          >
            BOOK MY FLIGHT
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

function WorldContinents() {
  return (
    <g opacity="0.5" fill="#1a2035" stroke="#252d45" strokeWidth="0.5">
      {/* North America */}
      <path d="M55,65 L70,55 L95,50 L120,48 L140,55 L155,65 L150,80 L145,95 L135,108 L125,118 L115,128 L100,135 L85,138 L72,132 L60,120 L52,105 L48,90 L50,75 Z" />
      {/* South America */}
      <path d="M105,162 L118,155 L128,160 L132,175 L135,195 L130,220 L125,240 L118,255 L110,250 L105,235 L100,210 L98,185 L100,170 Z" />
      {/* Europe */}
      <path d="M185,52 L200,48 L215,50 L230,55 L238,65 L240,78 L235,88 L225,95 L210,98 L195,95 L185,85 L182,70 Z" />
      {/* Africa */}
      <path d="M195,105 L215,100 L235,108 L245,125 L248,150 L242,180 L232,200 L218,210 L202,208 L190,195 L185,170 L182,145 L185,120 Z" />
      {/* Asia */}
      <path d="M245,42 L270,35 L300,38 L325,45 L345,55 L355,70 L352,88 L342,100 L325,108 L305,112 L285,108 L268,100 L252,88 L242,72 L240,55 Z" />
      {/* Australia */}
      <path d="M315,178 L335,172 L352,178 L358,192 L350,205 L335,212 L318,208 L308,198 L305,185 Z" />
    </g>
  )
}

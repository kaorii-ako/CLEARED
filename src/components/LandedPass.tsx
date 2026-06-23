import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../App'
import { lookupAirline } from '../lib/callsign'
import { lookupAircraftType } from '../lib/aircraft'
import type { SessionData } from '../types'

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface Props {
  onSave: (session: SessionData) => void
}

export default function LandedPass({ onSave }: Props) {
  const { state, dispatch } = useApp()
  const [notes, setNotes] = useState(state.notes)
  const [saved, setSaved] = useState(false)

  const flight = state.flight!
  const airline = lookupAirline(flight.state.callsign)
  const aircraftType = lookupAircraftType(flight.state.icao24)
  const seat = '14A' // cosmetic
  const squawk = flight.state.squawk

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()
  const landTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  function handleSave() {
    if (saved) return
    const session: SessionData = {
      id: crypto.randomUUID(),
      date: now.toISOString(),
      scenario: state.scenario,
      task: state.task,
      notes,
      flight: {
        callsign: flight.state.callsign,
        airline: airline.name,
        departureICAO: flight.departureICAO,
        departureCity: flight.departureCity,
        arrivalICAO: flight.arrivalICAO,
        arrivalCity: flight.arrivalCity,
        arrivalName: flight.arrivalName,
        aircraftType,
        squawk,
        seat,
        totalKm: flight.totalKm,
        remainingKm: flight.remainingKm,
        peakAltitude: Math.round(flight.state.baroAltitude / 30.48),
        avgSpeed: Math.round(flight.state.velocity * 1.94384),
      },
      duration: state.totalMs,
      landedEarly: state.landedEarly,
    }
    onSave(session)
    setSaved(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col items-center overflow-y-auto"
      style={{ background: 'var(--color-void)', padding: '36px 16px 16px' }}
    >
      {/* Boarding pass with stamp */}
      <div className="relative w-full max-w-[340px]">
        {/* LANDED stamp overlay */}
        <motion.div
          initial={{ scale: 2, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: -15 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.3 }}
          className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div
            className="border-4 rounded-full px-4 py-2"
            style={{
              borderColor: 'var(--color-pass-stamp)',
              color: 'var(--color-pass-stamp)',
              fontFamily: 'var(--font-mono)',
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: 4,
            }}
          >
            LANDED
          </div>
          <div
            className="text-center mt-1 text-[10px] tracking-wider"
            style={{ color: 'var(--color-pass-stamp)', fontFamily: 'var(--font-mono)' }}
          >
            {landTime}
          </div>
        </motion.div>

        {/* Boarding pass card */}
        <div className="w-full rounded-2xl overflow-hidden" style={{ background: 'var(--color-pass-bg)' }}>
          <div className="px-5 pt-5 pb-4" style={{ color: 'var(--color-pass-text)' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] tracking-wider text-pass-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                {dateStr}
              </span>
              {state.scenario && (
                <span className="text-[10px] tracking-wider bg-black/5 rounded-full px-2 py-0.5">
                  {state.scenario}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                  {flight.departureICAO ?? '???'}
                </div>
                <div className="text-[10px] text-pass-muted mt-0.5">{flight.departureCity ?? 'Unknown'}</div>
              </div>
              <div className="flex-1 flex items-center justify-center px-2">
                <div className="w-full border-t border-dashed border-pass-muted/30 relative">
                  <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-pass-bg px-1 text-pass-muted text-xs">✈</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                  {flight.arrivalICAO}
                </div>
                <div className="text-[10px] text-pass-muted mt-0.5">{flight.arrivalCity}</div>
              </div>
            </div>

            <div className="text-center text-[10px] tracking-wider text-pass-muted mb-4">
              <span className="font-semibold" style={{ color: airline.color }}>{airline.name}</span>
              <span className="mx-1">·</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{flight.state.callsign}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[9px] text-pass-muted tracking-wider">DISTANCE</div>
                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {flight.totalKm.toLocaleString()} km
                </div>
              </div>
              <div>
                <div className="text-[9px] text-pass-muted tracking-wider">DURATION</div>
                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatTime(state.totalMs)}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-pass-muted tracking-wider">AIRCRAFT</div>
                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {aircraftType.split(' ').pop()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="w-full max-w-[340px] mt-4 rounded-xl p-4" style={{ background: 'var(--color-panel)' }}>
        <div className="text-[10px] tracking-[3px] text-accent-amber text-center mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          ✈ WHEELS DOWN
        </div>

        <div className="space-y-2">
          <StatRow label="MISSION" value={state.task || 'Untitled'} />
          <StatRow label="FLIGHT" value={`${flight.state.callsign} · ${airline.name}`} />
          <StatRow label="ROUTE" value={`${flight.departureICAO ?? '???'} → ${flight.arrivalICAO} (${flight.arrivalCity})`} />
          <StatRow label="DURATION" value={`${formatTime(state.totalMs)} focused`} />
          <StatRow label="DISTANCE" value={`${flight.totalKm.toLocaleString()} km`} />
          <StatRow label="PEAK ALT" value={`FL${String(Math.round(flight.state.baroAltitude / 30.48)).padStart(3, '0')}`} />
          <StatRow label="AVG SPEED" value={`${Math.round(flight.state.velocity * 1.94384)} KT`} />

          {state.landedEarly && (
            <div className="text-center text-[10px] tracking-wider py-1 rounded-lg mt-2"
              style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60', fontFamily: 'var(--font-mono)' }}>
              ✓ REAL LANDING DETECTED
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mt-3">
          <div className="text-[9px] text-text-muted tracking-wider mb-1">NOTES</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full text-xs bg-transparent border border-border-faint rounded-lg p-2 outline-none resize-none text-text-primary placeholder:text-text-muted/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-[340px] mt-4 space-y-2">
        {!saved ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider"
            style={{
              background: 'var(--color-accent-amber)',
              color: 'var(--color-void)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            SAVE FLIGHT
          </motion.button>
        ) : (
          <div className="w-full py-3 rounded-xl text-sm text-center tracking-wider"
            style={{ background: 'rgba(39,174,96,0.15)', color: '#27ae60', fontFamily: 'var(--font-mono)' }}>
            ✓ SAVED
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="flex-1 py-2.5 rounded-xl text-xs tracking-wider border border-border-faint text-text-primary hover:bg-white/5 transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            NEW FLIGHT
          </button>
          <button
            onClick={() => dispatch({ type: 'GO_HISTORY' })}
            className="flex-1 py-2.5 rounded-xl text-xs tracking-wider border border-border-faint text-text-primary hover:bg-white/5 transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            VIEW HISTORY
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[9px] tracking-wider text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{label}</span>
      <span className="text-[11px] text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  )
}

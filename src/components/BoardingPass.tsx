import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../App'
import { lookupAirline } from '../lib/callsign'
import { lookupAircraftType } from '../lib/aircraft'

const SCENARIOS = [
  { icon: '📚', label: 'Study' },
  { icon: '💻', label: 'Code' },
  { icon: '📝', label: 'Work' },
  { icon: '📖', label: 'Read' },
  { icon: '🎨', label: 'Create' },
  { icon: '🧘', label: 'Rest' },
  { icon: '🧠', label: 'Brainstorm' },
  { icon: '📋', label: 'Planning' },
]

function randomSeat(): string {
  const row = Math.floor(Math.random() * 40) + 1
  const col = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]
  return `${row}${col}`
}

function formatDistance(km: number): string {
  return km.toLocaleString('en-US')
}

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function BoardingPass() {
  const { state, dispatch } = useApp()
  const [task, setTask] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedScenario, setSelectedScenario] = useState('')

  const flight = state.flight!
  const airline = lookupAirline(flight.state.callsign)
  const aircraftType = lookupAircraftType(flight.state.icao24)
  const seat = useMemo(() => randomSeat(), [])
  const squawk = flight.state.squawk

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()

  function handleDepart() {
    dispatch({ type: 'SET_TASK', task })
    dispatch({ type: 'SET_NOTES', notes })
    if (selectedScenario) dispatch({ type: 'SET_SCENARIO', scenario: selectedScenario })
    dispatch({ type: 'DEPART' })
  }

  return (
    <motion.div
      initial={{ y: 600, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 600, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full h-full flex flex-col items-center overflow-y-auto"
      style={{ background: 'var(--color-void)', padding: '36px 16px 16px' }}
    >
      {/* Boarding pass card */}
      <div className="w-full max-w-[340px] rounded-2xl overflow-hidden" style={{ background: 'var(--color-pass-bg)' }}>
        {/* Top section */}
        <div className="px-5 pt-5 pb-4" style={{ color: 'var(--color-pass-text)' }}>
          {/* Date and scenario */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] tracking-wider text-pass-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              {dateStr}
            </span>
            {selectedScenario && (
              <span className="text-[10px] tracking-wider bg-black/5 rounded-full px-2 py-0.5">
                {SCENARIOS.find(s => s.label === selectedScenario)?.icon} {selectedScenario}
              </span>
            )}
          </div>

          {/* Route */}
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

          {/* Airline */}
          <div className="text-center text-[10px] tracking-wider text-pass-muted mb-4">
            <span className="font-semibold" style={{ color: airline.color }}>{airline.name}</span>
            <span className="mx-1">·</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{flight.state.callsign}</span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 text-center mb-1">
            <div>
              <div className="text-[9px] text-pass-muted tracking-wider">DISTANCE</div>
              <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatDistance(flight.remainingKm)} km
              </div>
            </div>
            <div>
              <div className="text-[9px] text-pass-muted tracking-wider">REMAINING</div>
              <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatTime(flight.remainingMs)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-pass-muted tracking-wider">AIRCRAFT</div>
              <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                {aircraftType.split(' ').pop()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mt-3">
            <div>
              <div className="text-[9px] text-pass-muted tracking-wider">SEAT</div>
              <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{seat}</div>
            </div>
            <div>
              <div className="text-[9px] text-pass-muted tracking-wider">BOARDING</div>
              <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>Now</div>
            </div>
            <div>
              <div className="text-[9px] text-pass-muted tracking-wider">SQUAWK</div>
              <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{squawk}</div>
            </div>
          </div>
        </div>

        {/* Perforated divider */}
        <div className="relative border-t border-dashed border-black/10">
          <div className="absolute -right-1 -top-1.5 w-3 h-3 rounded-full" style={{ background: 'var(--color-void)' }} />
          <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full" style={{ background: 'var(--color-void)' }} />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-pass-muted text-[10px]">✂</div>
        </div>

        {/* Bottom stub */}
        <div className="px-5 py-4" style={{ color: 'var(--color-pass-text)' }}>
          {/* Scenario pills */}
          <div className="mb-3">
            <div className="text-[9px] text-pass-muted tracking-wider mb-2">SCENARIO</div>
            <div className="grid grid-cols-4 gap-1.5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedScenario(s.label)}
                  className="text-[10px] py-1.5 rounded-lg transition-all"
                  style={{
                    background: selectedScenario === s.label ? 'black' : 'rgba(0,0,0,0.05)',
                    color: selectedScenario === s.label ? 'white' : 'var(--color-pass-text)',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mission input */}
          <div className="mb-3">
            <div className="text-[9px] text-pass-muted tracking-wider mb-1">MISSION</div>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full text-sm bg-transparent border-b border-black/10 pb-1 outline-none placeholder:text-pass-muted/50"
            />
          </div>

          {/* Notes */}
          <div className="mb-3">
            <div className="text-[9px] text-pass-muted tracking-wider mb-1">NOTES</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pre-flight notes..."
              rows={2}
              className="w-full text-xs bg-transparent border border-black/10 rounded-lg p-2 outline-none resize-none placeholder:text-pass-muted/50"
            />
          </div>

          {/* Barcode */}
          <div className="flex gap-[1px] h-8 mb-3">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  background: 'var(--color-pass-text)',
                  opacity: Math.random() * 0.5 + 0.3,
                  maxWidth: Math.random() > 0.5 ? 3 : 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-[340px] mt-4 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDepart}
          className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wider"
          style={{
            background: 'var(--color-accent-amber)',
            color: 'var(--color-void)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          CLEARED FOR DEPARTURE ✈
        </motion.button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="w-full py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ← CHANGE FLIGHT
        </button>
      </div>
    </motion.div>
  )
}

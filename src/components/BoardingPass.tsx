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
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180 }}
      className="w-full h-full flex flex-col items-center overflow-y-auto"
      style={{ background: 'var(--color-void)', padding: '36px 12px 12px' }}
    >
      {/* Boarding pass card */}
      <div className="w-full max-w-[340px] rounded-2xl overflow-hidden relative"
        style={{ background: 'var(--color-pass-bg)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
        {/* Top section */}
        <div className="px-5 pt-4 pb-3" style={{ color: 'var(--color-pass-text)' }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] tracking-[2px] text-pass-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              {dateStr}
            </span>
            {selectedScenario && (
              <span className="text-[9px] tracking-wider bg-black/5 rounded-full px-2 py-0.5">
                {SCENARIOS.find(s => s.label === selectedScenario)?.icon} {selectedScenario}
              </span>
            )}
          </div>

          {/* Route */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-center flex-1">
              <div className="text-[22px] font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                {flight.departureICAO ?? '???'}
              </div>
              <div className="text-[9px] text-pass-muted mt-0.5">{flight.departureCity ?? 'Unknown'}</div>
            </div>
            <div className="flex-1 flex items-center justify-center px-1">
              <div className="w-full relative">
                <div className="border-t border-dashed border-black/15" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-pass-bg px-1.5 text-pass-muted text-[11px]">✈</span>
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[22px] font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
                {flight.arrivalICAO}
              </div>
              <div className="text-[9px] text-pass-muted mt-0.5">{flight.arrivalCity}</div>
            </div>
          </div>

          {/* Airline */}
          <div className="text-center text-[9px] tracking-wider text-pass-muted mb-3">
            <span className="font-semibold" style={{ color: airline.color }}>{airline.name}</span>
            <span className="mx-1.5">·</span>
            <span className="font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{flight.state.callsign}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <StatBlock label="DISTANCE" value={`${formatDistance(flight.remainingKm)} km`} />
            <StatBlock label="REMAINING" value={formatTime(flight.remainingMs)} />
            <StatBlock label="AIRCRAFT" value={aircraftType.split(' ').pop() || 'N/A'} />
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center mt-2">
            <StatBlock label="SEAT" value={seat} />
            <StatBlock label="BOARDING" value="Now" />
            <StatBlock label="SQUAWK" value={squawk} />
          </div>
        </div>

        {/* Perforated divider */}
        <div className="relative border-t border-dashed" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
          <div className="absolute -right-1.5 -top-1.5 w-3 h-3 rounded-full" style={{ background: 'var(--color-void)' }} />
          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full" style={{ background: 'var(--color-void)' }} />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-pass-muted/40 text-[10px]">✂</div>
        </div>

        {/* Bottom stub */}
        <div className="px-5 py-3" style={{ color: 'var(--color-pass-text)' }}>
          {/* Scenario pills */}
          <div className="mb-2.5">
            <div className="text-[8px] text-pass-muted tracking-[2px] mb-1.5">SCENARIO</div>
            <div className="grid grid-cols-4 gap-1">
              {SCENARIOS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setSelectedScenario(s.label)}
                  className="text-[9px] py-1 rounded-md transition-all duration-150"
                  style={{
                    background: selectedScenario === s.label ? '#1a1a1a' : 'rgba(0,0,0,0.04)',
                    color: selectedScenario === s.label ? 'white' : 'var(--color-pass-text)',
                  }}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mission */}
          <div className="mb-2">
            <div className="text-[8px] text-pass-muted tracking-[2px] mb-1">MISSION</div>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What are you focusing on?"
              className="w-full text-xs bg-transparent border-b border-black/10 pb-1 outline-none placeholder:text-pass-muted/40 focus:border-black/25 transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="mb-2">
            <div className="text-[8px] text-pass-muted tracking-[2px] mb-1">NOTES</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pre-flight notes..."
              rows={2}
              className="w-full text-[10px] bg-transparent border border-black/8 rounded-md p-1.5 outline-none resize-none placeholder:text-pass-muted/40 focus:border-black/20 transition-colors"
            />
          </div>

          {/* Barcode */}
          <div className="flex gap-[1px] h-7 mb-1">
            {Array.from({ length: 55 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-pass-text)',
                  opacity: 0.15 + Math.random() * 0.35,
                  width: Math.random() > 0.6 ? 2 : 1,
                  height: '100%',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-[340px] mt-3 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDepart}
          className="w-full py-3.5 rounded-xl text-sm font-bold tracking-wider"
          style={{
            background: 'linear-gradient(135deg, #e8a020, #f0c040)',
            color: 'var(--color-void)',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 4px 20px rgba(232,160,32,0.3)',
          }}
        >
          CLEARED FOR DEPARTURE ✈
        </motion.button>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="w-full py-2 text-[10px] text-text-muted hover:text-text-primary transition-colors tracking-wider"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ← CHANGE FLIGHT
        </button>
      </div>
    </motion.div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[7px] text-pass-muted tracking-[1.5px] mb-0.5">{label}</div>
      <div className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  )
}

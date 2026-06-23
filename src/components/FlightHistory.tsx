import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../App'
import { lookupAirline } from '../lib/callsign'
import type { SessionData } from '../types'

export default function FlightHistory() {
  const { dispatch } = useApp()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sessions = useMemo(() => {
    const raw = localStorage.getItem('cleared:sessions')
    return (raw ? JSON.parse(raw) : []).reverse() as SessionData[]
  }, [])

  const totalKm = useMemo(() => {
    return sessions.reduce((sum, s) => sum + s.flight.totalKm, 0)
  }, [sessions])

  const totalTime = useMemo(() => {
    return sessions.reduce((sum, s) => sum + s.duration, 0)
  }, [sessions])

  function formatDuration(ms: number): string {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const expanded = sessions.find((s) => s.id === expandedId)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col"
      style={{ background: 'var(--color-void)', padding: '36px 16px 16px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[3px] text-accent-amber" style={{ fontFamily: 'var(--font-mono)' }}>
            FLIGHT HISTORY
          </div>
          <div className="text-[11px] text-text-muted mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
            {sessions.length} flights · {totalKm.toLocaleString()} km · {formatDuration(totalTime)}
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-[10px] text-text-muted hover:text-text-primary transition-colors"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          ← BACK
        </button>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-4 rounded-xl p-4"
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border-faint)' }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {expanded.flight.departureICAO ?? '???'} → {expanded.flight.arrivalICAO}
                </div>
                <div className="text-[10px] text-text-muted">{expanded.flight.arrivalCity}</div>
              </div>
              <button
                onClick={() => setExpandedId(null)}
                className="text-[10px] text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
              <div className="flex justify-between">
                <span className="text-text-muted">FLIGHT</span>
                <span>{expanded.flight.callsign} · {expanded.flight.airline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">DURATION</span>
                <span>{formatDuration(expanded.duration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">DISTANCE</span>
                <span>{expanded.flight.totalKm.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">AIRCRAFT</span>
                <span>{expanded.flight.aircraftType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">DATE</span>
                <span>{formatDate(expanded.date)}</span>
              </div>
              {expanded.task && (
                <div className="flex justify-between">
                  <span className="text-text-muted">MISSION</span>
                  <span>{expanded.task}</span>
                </div>
              )}
              {expanded.notes && (
                <div className="mt-2 text-text-muted text-[10px] border-t border-border-faint pt-2">
                  {expanded.notes}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.map((session) => {
          const airline = lookupAirline(session.flight.callsign)
          return (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-white/5"
              style={{
                background: 'var(--color-panel)',
                border: expandedId === session.id ? '1px solid var(--color-accent-amber)' : '1px solid var(--color-border-faint)',
              }}
            >
              {/* Mini LANDED stamp */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold border-2"
                style={{
                  borderColor: 'var(--color-pass-stamp)',
                  color: 'var(--color-pass-stamp)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ✓
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-amber)' }}>
                    {session.flight.callsign}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {session.flight.departureICAO ?? '???'} → {session.flight.arrivalICAO}
                  </span>
                </div>
                <div className="text-[10px] text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatDuration(session.duration)} · {session.scenario || 'Focus'} · {formatDate(session.date)}
                </div>
              </div>
            </motion.button>
          )
        })}

        {sessions.length === 0 && (
          <div className="text-center text-text-muted text-xs py-12">
            No flights yet. Take off!
          </div>
        )}
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { useApp } from '../App'
import { useTimer } from '../hooks/useTimer'

export default function Descent() {
  const { state } = useApp()
  const { formatted, progress } = useTimer()

  const flight = state.flight!
  const altFL = Math.round(flight.state.baroAltitude / 30.48)

  // Time remaining estimate based on progress
  const remaining = Math.max(0, state.totalMs - state.elapsedMs)
  const remainingS = Math.floor(remaining / 1000)
  const mins = Math.floor(remainingS / 60)
  const secs = remainingS % 60

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute top-10 left-0 right-0 z-20 pointer-events-none"
    >
      {/* Blinking status */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <motion.div
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--color-accent-amber)' }}
        />
        <span
          className="text-[10px] tracking-[3px]"
          style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}
        >
          FINAL APPROACH
        </span>
      </div>

      {/* Time to landing */}
      <div className="text-center">
        <span
          className="text-lg font-bold"
          style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}
        >
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <span
          className="text-[9px] tracking-wider ml-2 text-text-muted"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          TO LANDING
        </span>
      </div>
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../App'
import { useTimer } from '../hooks/useTimer'

export default function Runway() {
  const { state } = useApp()
  const { progress } = useTimer()
  const [altitude, setAltitude] = useState(0)
  const [status, setStatus] = useState('V1')

  useEffect(() => {
    if (progress < 0.025) {
      setStatus('V1')
      setAltitude(0)
    } else {
      setStatus('ROTATE')
      setAltitude(Math.floor(progress * 350))
    }
  }, [progress])

  const speed = Math.floor(60 + progress * 420)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full overflow-hidden"
      style={{ background: '#050608' }}
    >
      {/* Stars background */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() > 0.8 ? 2 : 1,
              height: Math.random() > 0.8 ? 2 : 1,
              opacity: 0.1 + Math.random() * 0.4,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
            }}
          />
        ))}
      </div>

      {/* Runway perspective */}
      <div
        className="absolute inset-0"
        style={{ perspective: '600px' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '100%',
            transform: 'rotateX(45deg)',
            transformOrigin: 'center bottom',
          }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 180, height: '120%' }}>
            {/* Center line dashes */}
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 -translate-x-1/2 bg-white"
                style={{
                  width: 2,
                  height: 20,
                  opacity: 0.5,
                  bottom: `${((i * 4 + progress * 600) % 120)}%`,
                }}
              />
            ))}
            {/* Edge lights */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`l${i}`}
                className="absolute bg-amber-400/60 rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  left: -4,
                  bottom: `${i * 6}%`,
                  boxShadow: '0 0 6px rgba(251,191,36,0.4)',
                }}
              />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={`r${i}`}
                className="absolute bg-amber-400/60 rounded-full"
                style={{
                  width: 3,
                  height: 3,
                  right: -4,
                  bottom: `${i * 6}%`,
                  boxShadow: '0 0 6px rgba(251,191,36,0.4)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Plane icon */}
      <motion.div
        className="absolute z-10 left-1/2 -translate-x-1/2"
        animate={{
          bottom: `${12 + progress * 55}%`,
          scale: 0.7 + progress * 0.6,
          opacity: Math.min(1, progress * 10),
        }}
        transition={{ duration: 0.05 }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--color-accent-amber)"
          style={{ filter: 'drop-shadow(0 0 12px rgba(232,160,32,0.6))' }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </motion.div>

      {/* HUD */}
      <div className="absolute bottom-20 left-0 right-0 text-center z-20">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-[10px] tracking-[4px] mb-1"
          style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}
        >
          {status}
        </motion.div>
        <div className="flex justify-center gap-8">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              FL{String(altitude).padStart(3, '0')}
            </div>
            <div className="text-[8px] tracking-wider text-text-muted">ALTITUDE</div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}>
              {speed}
            </div>
            <div className="text-[8px] tracking-wider text-text-muted">KNOTS</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="absolute top-14 left-0 right-0 text-center z-20">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-[10px] tracking-[5px]"
          style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}
        >
          TAKEOFF
        </motion.div>
      </div>
    </motion.div>
  )
}

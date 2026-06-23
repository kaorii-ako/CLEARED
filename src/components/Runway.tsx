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
      setAltitude(Math.floor(progress * 200))
    }
  }, [progress])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--color-void)', perspective: '600px' }}
    >
      {/* Runway perspective */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'rotateX(40deg)',
          transformOrigin: 'center bottom',
        }}
      >
        {/* Runway surface */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: 200, height: '100%' }}>
          {/* Center line dashes */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: 3,
                height: 30,
                background: 'white',
                opacity: 0.6,
                bottom: `${i * 5 + ((progress * 500) % 5)}%`,
              }}
              animate={{
                bottom: [`${i * 5}%`, `${i * 5 - 100}%`],
              }}
              transition={{
                duration: 1.5 / (1 + progress * 10),
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Edge lines */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/20" />
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20" />
        </div>
      </div>

      {/* Plane icon */}
      <motion.div
        className="absolute z-10"
        animate={{
          bottom: `${15 + progress * 60}%`,
          scale: 0.8 + progress * 0.4,
        }}
        transition={{ duration: 0.1 }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-accent-amber)">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </motion.div>

      {/* HUD overlay */}
      <div className="absolute bottom-16 left-0 right-0 text-center z-20">
        <div className="text-[10px] tracking-[4px] text-text-muted mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
          {status}
        </div>
        <div className="text-3xl font-bold" style={{ color: 'var(--color-accent-cyan)', fontFamily: 'var(--font-mono)' }}>
          FL{String(altitude).padStart(3, '0')}
        </div>
      </div>

      {/* Status text */}
      <div className="absolute top-16 left-0 right-0 text-center z-20">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-[10px] tracking-[4px]"
          style={{ color: 'var(--color-accent-amber)', fontFamily: 'var(--font-mono)' }}
        >
          TAKEOFF
        </motion.div>
      </div>
    </motion.div>
  )
}

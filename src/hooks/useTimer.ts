import { useRef, useCallback, useEffect } from 'react'
import { useApp } from '../App'

export function useTimer() {
  const { state, dispatch } = useApp()
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)

  const tick = useCallback(() => {
    const now = performance.now()
    if (lastTickRef.current > 0) {
      const delta = now - lastTickRef.current
      dispatch({ type: 'TICK', deltaMs: delta })
    }
    lastTickRef.current = now

    if (state.phase === 'CRUISE' || state.phase === 'TAKEOFF' || state.phase === 'APPROACH') {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [dispatch, state.phase])

  useEffect(() => {
    if (state.phase === 'TAKEOFF' || state.phase === 'CRUISE' || state.phase === 'APPROACH') {
      lastTickRef.current = 0
      rafRef.current = requestAnimationFrame(tick)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [state.phase, tick])

  const remaining = Math.max(0, state.totalMs - state.elapsedMs)
  const remainingH = Math.floor(remaining / 3600000)
  const remainingM = Math.floor((remaining % 3600000) / 60000)
  const remainingS = Math.floor((remaining % 60000) / 1000)
  const formatted = `${remainingH}:${String(remainingM).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}`
  const progress = state.totalMs > 0 ? state.elapsedMs / state.totalMs : 0

  return { remaining, formatted, progress, paused: state.paused }
}

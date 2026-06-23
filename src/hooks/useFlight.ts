import { useEffect, useRef } from 'react'
import { useApp } from '../App'
import { pollAircraft } from '../lib/opensky'

const POLL_INTERVAL = 30_000
const MAX_NULL_POLLS = 3

export function useFlight() {
  const { state, dispatch } = useApp()
  const nullCountRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!state.flight) return
    if (state.phase !== 'CRUISE' && state.phase !== 'APPROACH' && state.phase !== 'TAKEOFF') {
      return
    }

    nullCountRef.current = 0

    intervalRef.current = setInterval(async () => {
      const result = await pollAircraft(state.flight!.state.icao24)

      if (!result) {
        nullCountRef.current++
        if (nullCountRef.current >= MAX_NULL_POLLS) {
          dispatch({ type: 'REAL_LANDING_DETECTED' })
        }
        return
      }

      nullCountRef.current = 0

      if (result.onGround) {
        dispatch({ type: 'REAL_LANDING_DETECTED' })
        return
      }

      // Update the flight state with fresh data
      const updatedFlight = {
        ...state.flight!,
        state: result,
      }
      dispatch({ type: 'SET_FLIGHT', flight: updatedFlight })
    }, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state.flight?.state.icao24, state.phase, dispatch])

  return {
    signalLost: nullCountRef.current > 0,
    nullCount: nullCountRef.current,
  }
}

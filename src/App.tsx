import { useReducer, useCallback, createContext, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Phase, ResolvedFlight, SessionData, MapStyle } from './types'
import FlightGlobe from './components/FlightGlobe'
import BoardingPass from './components/BoardingPass'
import Runway from './components/Runway'
import CruiseMap from './components/CruiseMap'
import WindowView from './components/WindowView'
import Descent from './components/Descent'
import LandedPass from './components/LandedPass'
import FlightHistory from './components/FlightHistory'

interface AppState {
  phase: Phase
  flight: ResolvedFlight | null
  scenario: string
  task: string
  notes: string
  totalMs: number
  elapsedMs: number
  paused: boolean
  landedEarly: boolean
  mapStyle: MapStyle
  showWindowView: boolean
}

type Action =
  | { type: 'SET_FLIGHT'; flight: ResolvedFlight }
  | { type: 'SET_SCENARIO'; scenario: string }
  | { type: 'SET_TASK'; task: string }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'DEPART' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'REAL_LANDING_DETECTED' }
  | { type: 'TOGGLE_WINDOW_VIEW' }
  | { type: 'SET_MAP_STYLE'; style: MapStyle }
  | { type: 'GO_HISTORY' }
  | { type: 'RESET' }

const TAKEOFF_END = 0.05
const APPROACH_START = 0.95

function derivePhase(elapsed: number, total: number): Phase {
  if (total === 0) return 'BOARDING'
  const ratio = elapsed / total
  if (ratio < TAKEOFF_END) return 'TAKEOFF'
  if (ratio >= APPROACH_START) return 'APPROACH'
  return 'CRUISE'
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FLIGHT':
      return {
        ...state,
        flight: action.flight,
        phase: 'BOARDING',
        totalMs: action.flight.remainingMs,
      }
    case 'SET_SCENARIO':
      return { ...state, scenario: action.scenario }
    case 'SET_TASK':
      return { ...state, task: action.task }
    case 'SET_NOTES':
      return { ...state, notes: action.notes }
    case 'DEPART':
      return { ...state, phase: 'TAKEOFF', elapsedMs: 0 }
    case 'TICK': {
      if (state.paused) return state
      const elapsedMs = Math.min(state.elapsedMs + action.deltaMs, state.totalMs)
      const phase = derivePhase(elapsedMs, state.totalMs)
      return { ...state, elapsedMs, phase }
    }
    case 'PAUSE':
      return { ...state, paused: true }
    case 'RESUME':
      return { ...state, paused: false }
    case 'REAL_LANDING_DETECTED':
      return { ...state, phase: 'LANDED', landedEarly: true, elapsedMs: state.totalMs }
    case 'TOGGLE_WINDOW_VIEW':
      return { ...state, showWindowView: !state.showWindowView }
    case 'SET_MAP_STYLE':
      return { ...state, mapStyle: action.style }
    case 'GO_HISTORY':
      return { ...state, phase: 'HISTORY' }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

const initialState: AppState = {
  phase: 'BROWSING',
  flight: null,
  scenario: '',
  task: '',
  notes: '',
  totalMs: 0,
  elapsedMs: 0,
  paused: false,
  landedEarly: false,
  mapStyle: (localStorage.getItem('cleared:mapStyle') as MapStyle) || 'dark',
  showWindowView: false,
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContext')
  return ctx
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const handleSaveSession = useCallback((session: SessionData) => {
    const raw = localStorage.getItem('cleared:sessions')
    const sessions: SessionData[] = raw ? JSON.parse(raw) : []
    sessions.push(session)
    localStorage.setItem('cleared:sessions', JSON.stringify(sessions))
    const prevKm = parseFloat(localStorage.getItem('cleared:totalKm') || '0')
    localStorage.setItem('cleared:totalKm', String(prevKm + session.flight.totalKm))
  }, [])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className="relative w-full h-full overflow-hidden" style={{ background: 'var(--color-void)', borderRadius: 14 }}>
        <DragHandle />
        <AnimatePresence mode="wait">
          {state.phase === 'BROWSING' && <FlightGlobe key="globe" />}
          {state.phase === 'BOARDING' && <BoardingPass key="boarding" />}
          {state.phase === 'TAKEOFF' && <Runway key="runway" />}
          {(state.phase === 'CRUISE' || state.phase === 'APPROACH') &&
            !state.showWindowView && <CruiseMap key="cruise" />}
          {(state.phase === 'CRUISE' || state.phase === 'APPROACH') &&
            state.showWindowView && <WindowView key="window" />}
          {state.phase === 'APPROACH' && !state.showWindowView && (
            <Descent key="descent" />
          )}
          {state.phase === 'LANDED' && (
            <LandedPass key="landed" onSave={handleSaveSession} />
          )}
          {state.phase === 'HISTORY' && <FlightHistory key="history" />}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  )
}

function DragHandle() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="absolute top-0 left-0 right-0 h-8 z-50 flex items-center justify-between px-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="text-[9px] tracking-[3px] text-text-muted/40" style={{ fontFamily: 'var(--font-mono)' }}>
        CLEARED
      </div>
      <button
        onClick={() => window.electronAPI?.close()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-3.5 h-3.5 rounded-full transition-all duration-200 flex items-center justify-center"
        style={{
          background: hovered ? 'rgba(220,38,38,0.8)' : 'rgba(255,255,255,0.08)',
          WebkitAppRegion: 'no-drag',
        } as React.CSSProperties}
      >
        {hovered && (
          <svg width="6" height="6" viewBox="0 0 10 10" stroke="white" strokeWidth="1.5">
            <line x1="2" y1="2" x2="8" y2="8" />
            <line x1="8" y1="2" x2="2" y2="8" />
          </svg>
        )}
      </button>
    </div>
  )
}

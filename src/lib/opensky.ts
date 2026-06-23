import type { AircraftState } from '../types'

const BASE = 'https://opensky-network.org/api'

let flightsCache: AircraftState[] = []
let flightsCacheTime = 0
const CACHE_TTL = 60_000

export async function fetchCruisingFlights(): Promise<AircraftState[]> {
  const now = Date.now()
  if (flightsCache.length > 0 && now - flightsCacheTime < CACHE_TTL) {
    return flightsCache
  }

  const res = await fetch(`${BASE}/states/all`)
  const { states } = await res.json()

  flightsCache = (states ?? [])
    .filter(
      (s: any[]) =>
        s[7] != null &&
        s[7] > 9000 &&
        s[8] === false &&
        s[9] != null &&
        s[9] > 200 &&
        s[1]?.trim()
    )
    .map((s: any[]): AircraftState => ({
      icao24: s[0],
      callsign: s[1].trim(),
      originCountry: s[2],
      longitude: s[5],
      latitude: s[6],
      baroAltitude: s[7],
      onGround: s[8],
      velocity: s[9],
      trueTrack: s[10] ?? 0,
      verticalRate: s[11] ?? 0,
      squawk: s[14] ?? '2000',
    }))

  flightsCacheTime = now
  return flightsCache
}

export async function fetchFlightRoute(
  icao24: string
): Promise<{ departure: string | null; arrival: string | null }> {
  const now = Math.floor(Date.now() / 1000)
  const begin = now - 3600 * 14

  try {
    const res = await fetch(
      `${BASE}/flights/aircraft?icao24=${icao24}&begin=${begin}&end=${now}`
    )
    if (!res.ok) return { departure: null, arrival: null }
    const flights = await res.json()
    const latest = flights?.[flights.length - 1]
    return {
      departure: latest?.estDepartureAirport ?? null,
      arrival: latest?.estArrivalAirport ?? null,
    }
  } catch {
    return { departure: null, arrival: null }
  }
}

let pollQueue: Array<{ icao24: string; resolve: (v: AircraftState | null) => void }> = []
let pollProcessing = false

async function processPollQueue() {
  if (pollProcessing || pollQueue.length === 0) return
  pollProcessing = true

  while (pollQueue.length > 0) {
    const { icao24, resolve } = pollQueue.shift()!
    try {
      const res = await fetch(`${BASE}/states/all?icao24=${icao24}`)
      const { states } = await res.json()
      if (states?.[0]) {
        const s = states[0]
        resolve({
          icao24: s[0],
          callsign: s[1]?.trim() ?? '',
          originCountry: s[2],
          longitude: s[5],
          latitude: s[6],
          baroAltitude: s[7] ?? 0,
          onGround: s[8] ?? false,
          velocity: s[9] ?? 0,
          trueTrack: s[10] ?? 0,
          verticalRate: s[11] ?? 0,
          squawk: s[14] ?? '2000',
        })
      } else {
        resolve(null)
      }
    } catch {
      resolve(null)
    }
    if (pollQueue.length > 0) {
      await new Promise((r) => setTimeout(r, 1200))
    }
  }

  pollProcessing = false
}

export function pollAircraft(icao24: string): Promise<AircraftState | null> {
  return new Promise((resolve) => {
    pollQueue.push({ icao24, resolve })
    processPollQueue()
  })
}

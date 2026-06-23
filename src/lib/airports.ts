import airportsData from '../data/airports.json'
import type { AirportInfo } from '../types'

const airports = airportsData as AirportInfo[]

const byIcao = new Map<string, AirportInfo>()
for (const a of airports) {
  byIcao.set(a.icao, a)
}

export function getAirportCoords(icao: string): [number, number] | null {
  const a = byIcao.get(icao)
  return a ? [a.latitude, a.longitude] : null
}

export function getAirportInfo(icao: string): AirportInfo | null {
  return byIcao.get(icao) ?? null
}

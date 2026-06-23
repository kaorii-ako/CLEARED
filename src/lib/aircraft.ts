import aircraftData from '../data/aircraft-types.json'

const data = aircraftData as Record<string, string>

export function lookupAircraftType(icao24: string): string {
  const suffix = icao24.substring(icao24.length - 3).toLowerCase()
  return data[suffix] ?? 'Unknown Aircraft'
}

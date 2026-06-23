import { getAirportCoords, getAirportInfo } from './airports'
import { haversineKm } from './geo'
import type { AircraftState, ResolvedFlight } from '../types'

export function resolveFlightDuration(
  state: AircraftState,
  arrivalICAO: string,
  departureICAO: string | null
): ResolvedFlight | null {
  const arrivalCoords = getAirportCoords(arrivalICAO)
  if (!arrivalCoords) return null

  const arrivalInfo = getAirportInfo(arrivalICAO)
  const departureInfo = departureICAO ? getAirportInfo(departureICAO) : null

  const currentPos: [number, number] = [state.latitude, state.longitude]
  const remainingKm = haversineKm(currentPos, arrivalCoords)
  const velocityKmh = state.velocity * 3.6
  if (velocityKmh < 1) return null

  const remainingHours = remainingKm / velocityKmh
  const remainingMs = remainingHours * 3600 * 1000

  const departureCoords = departureICAO ? getAirportCoords(departureICAO) : null
  const totalKm = departureCoords
    ? haversineKm(departureCoords, arrivalCoords)
    : remainingKm
  const progressRatio = Math.max(0, Math.min(0.99, 1 - remainingKm / totalKm))

  return {
    state,
    departureICAO,
    arrivalICAO,
    arrivalCity: arrivalInfo?.city ?? arrivalICAO,
    arrivalName: arrivalInfo?.name ?? arrivalICAO,
    departureCity: departureInfo?.city ?? null,
    departureCoords: departureCoords ?? null,
    arrivalCoords,
    remainingKm,
    remainingMs,
    totalKm,
    progressRatio,
  }
}

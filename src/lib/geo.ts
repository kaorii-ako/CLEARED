export function haversineKm(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function greatCirclePoints(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number],
  steps = 60
): [number, number][] {
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = lat1 + (lat2 - lat1) * t
    const lon = lon1 + (lon2 - lon1) * t
    points.push([lat, lon])
  }
  return points
}

export function latLonToSVG(
  lat: number,
  lon: number,
  w: number,
  h: number
): [number, number] {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h]
}

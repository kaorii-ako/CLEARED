export interface AircraftState {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  baroAltitude: number;
  onGround: boolean;
  velocity: number;
  trueTrack: number;
  verticalRate: number;
  squawk: string;
}

export interface ResolvedFlight {
  state: AircraftState;
  departureICAO: string | null;
  arrivalICAO: string;
  arrivalCity: string;
  arrivalName: string;
  departureCity: string | null;
  arrivalCoords: [number, number];
  departureCoords: [number, number] | null;
  remainingKm: number;
  remainingMs: number;
  totalKm: number;
  progressRatio: number;
}

export interface AirportInfo {
  icao: string;
  iata: string | null;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface SessionData {
  id: string;
  date: string;
  scenario: string;
  task: string;
  notes: string;
  flight: {
    callsign: string;
    airline: string;
    departureICAO: string | null;
    departureCity: string | null;
    arrivalICAO: string;
    arrivalCity: string;
    arrivalName: string;
    aircraftType: string;
    squawk: string;
    seat: string;
    totalKm: number;
    remainingKm: number;
    peakAltitude: number;
    avgSpeed: number;
  };
  duration: number;
  landedEarly: boolean;
}

export type Phase =
  | 'BROWSING'
  | 'SCENARIO'
  | 'BOARDING'
  | 'TAKEOFF'
  | 'CRUISE'
  | 'APPROACH'
  | 'LANDED'
  | 'HISTORY'
  | 'CONTRAIL'
  | 'MILES';

export type MapStyle = 'dark' | 'satellite' | 'classic';

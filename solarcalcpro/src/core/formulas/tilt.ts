/**
 * PV array tilt & orientation guidance (study §6).
 *
 * A fixed-tilt array's monthly beam capture relative to the horizontal is
 * modelled with noon solar geometry:
 *
 *   sin(alt)     = sin φ sin δ + cos φ cos δ            (solar noon, h = 0)
 *   cos(incid)   = sin(alt) cos T + cos(alt) sin T cos ψ
 *   monthlyRatio = cos(incid) / sin(alt)
 *
 * where φ is latitude, δ the mid-month solar declination, T the array tilt
 * and ψ the azimuth offset from the equator-facing direction (south in the
 * northern hemisphere, north in the southern). The ratio is floored at a
 * diffuse-only bound so that a badly oriented array never reports zero.
 *
 * Optimal-tilt rules of thumb (battery systems are winter-priority because
 * they are sized on the winter design month):
 *   annual-optimum ≈ 0.92·|φ|   (clamped 5–60°)
 *   winter-priority ≈ |φ| + 10° (clamped 5–60°)
 *
 * All functions are pure.
 */

const DAYS_OF_MONTH_MIDPOINT = [15, 46, 74, 105, 135, 162, 198, 228, 258, 288, 318, 344];
const MAX_TILT = 60;
const DIFFUSE_FLOOR = 0.1;

export type OptimalTiltMode = 'annual' | 'winter';

export interface OrientationFactors {
  /** Mean monthly beam-capture ratio (1 = horizontal-equivalent). */
  annual: number;
  /** Per-month beam-capture ratio (same order as the production months). */
  monthly: number[];
  /** Optimal tilt for the site latitude (winter-priority rule). */
  optimalTilt: number;
  /** Azimuth offset from the equator-facing direction (0–180°). */
  azimuthFromEquator: number;
}

const deg2rad = (deg: number): number => (deg * Math.PI) / 180;
const rad2deg = (rad: number): number => (rad * 180) / Math.PI;

/** Solar declination (°) at the mid-point of the given month (1–12). */
export function solarDeclinationDeg(month: number): number {
  const m = ((month - 1 + 12) % 12) + 1;
  const day = DAYS_OF_MONTH_MIDPOINT[m - 1];
  return 23.45 * Math.sin(((2 * Math.PI) / 365) * (284 + day));
}

/** Solar altitude (°) at solar noon for a latitude and declination. */
export function noonSolarAltitudeDeg(latitude: number, declinationDeg: number): number {
  const altRad = Math.asin(
    Math.sin(deg2rad(latitude)) * Math.sin(deg2rad(declinationDeg)) +
      Math.cos(deg2rad(latitude)) * Math.cos(deg2rad(declinationDeg)),
  );
  return rad2deg(altRad);
}

/**
 * Beam-capture ratio for a tilted, oriented surface vs the horizontal plane
 * at solar noon for one month. Returns the diffuse floor when the sun is
 * below the horizon or the projected beam falls behind the panel.
 */
export function monthlyTiltFactor(
  latitude: number,
  tiltDeg: number,
  azimuthDeg: number,
  month: number,
): number {
  const decl = solarDeclinationDeg(month);
  const altDeg = noonSolarAltitudeDeg(latitude, decl);
  if (altDeg <= 0) return DIFFUSE_FLOOR;

  const sinAlt = Math.sin(deg2rad(altDeg));
  const cosAlt = Math.cos(deg2rad(altDeg));
  const tilt = Math.min(MAX_TILT, Math.max(0, tiltDeg));
  const equatorAzimuth = latitude >= 0 ? 180 : 0;
  let offset = azimuthDeg - equatorAzimuth;
  while (offset > 180) offset -= 360;
  while (offset < -180) offset += 360;

  const factor =
    Math.cos(deg2rad(tilt)) +
    (cosAlt / sinAlt) * Math.sin(deg2rad(tilt)) * Math.cos(deg2rad(offset));
  return Math.min(1.5, Math.max(DIFFUSE_FLOOR, factor));
}

/** Optimal fixed tilt (°) for a latitude under the given priority. */
export function annualOptimalTilt(latitude: number, mode: OptimalTiltMode = 'annual'): number {
  const abs = Math.abs(latitude);
  const raw = mode === 'winter' ? abs + 10 : 0.92 * abs;
  return Math.round(Math.min(MAX_TILT, Math.max(5, raw)));
}

/** Annual + per-month beam-capture factors for a tilt/azimuth at a latitude. */
export function orientationFactors(
  latitude: number,
  tiltDeg: number,
  azimuthDeg: number,
): OrientationFactors {
  const monthly = Array.from({ length: 12 }, (_, i) =>
    monthlyTiltFactor(latitude, tiltDeg, azimuthDeg, i + 1),
  );
  const annual = monthly.reduce((sum, f) => sum + f, 0) / 12;

  const equatorAzimuth = latitude >= 0 ? 180 : 0;
  let offset = azimuthDeg - equatorAzimuth;
  while (offset > 180) offset -= 360;
  while (offset < -180) offset += 360;

  return {
    annual: Math.round(annual * 1000) / 1000,
    monthly: monthly.map((f) => Math.round(f * 1000) / 1000),
    optimalTilt: annualOptimalTilt(latitude, 'winter'),
    azimuthFromEquator: Math.round(Math.abs(offset) * 10) / 10,
  };
}

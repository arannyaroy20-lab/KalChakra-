/**
 * Surya Siddhanta solar model used by traditional West Bengal Panjikas (e.g. Gupta Press style).
 *
 * Sidereal (nirayana) Sun = mean Sun − manda equation, referred directly to the fixed zodiac, so no ayanamsa is needed.
 * Constants follow the classical text; the manda epicycle (13°40′–14°) is averaged to 13°50′.
 * This is an analytical approximation, not a reproduction of any publisher's printed table.
 */
const DEG = Math.PI / 180;
/** Surya Siddhanta sidereal year in days (365d 15gh 31pa 31vi 24pra). */
const SIDEREAL_YEAR_DAYS = 365.258756;
/** Julian Day of the Kali Yuga epoch (midnight starting 18 Feb 3102 BCE, Julian) at the Ujjain meridian. */
const KALI_EPOCH_JD_UJJAIN = 588_465.5 - 75.77 / 360;
/** Longitude of the Sun's apogee (mandocca), degrees. */
const SUN_APOGEE_DEG = 77.28;
/** Manda epicycle circumference, degrees (of 360). */
const MANDA_EPICYCLE_DEG = 13.8333;

const norm = (value: number): number => ((value % 360) + 360) % 360;

export function suryaSiddhantaSunLongitude(jd: number): number {
  const mean = norm(((jd - KALI_EPOCH_JD_UJJAIN) / SIDEREAL_YEAR_DAYS) * 360);
  const anomaly = (mean - SUN_APOGEE_DEG) * DEG;
  const equation = Math.asin((MANDA_EPICYCLE_DEG / 360) * Math.sin(anomaly)) / DEG;
  return norm(mean - equation);
}

import type { GeoLocation } from "../types.js";
import { julianDay } from "./meeus.js";
import { dayDifference, localDateAt } from "../services/date-time.js";

const rad = Math.PI / 180;
function solarTerms(jd: number): { equationOfTime: number; declination: number } {
  const t = (jd - 2_451_545) / 36_525;
  const epsilon = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const l0 = (280.46646 + t * (36000.76983 + 0.0003032 * t)) % 360;
  const m = (357.52911 + t * (35999.05029 - 0.0001537 * t)) * rad;
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const c = (1.914602 - t * (0.004817 + 0.000014 * t)) * Math.sin(m) + (0.019993 - 0.000101 * t) * Math.sin(2 * m) + 0.000289 * Math.sin(3 * m);
  const omega = (125.04 - 1934.136 * t) * rad;
  const lambda = (l0 + c - 0.00569 - 0.00478 * Math.sin(omega)) * rad;
  const y = Math.tan((epsilon * rad) / 2) ** 2;
  const l0r = l0 * rad;
  const eq = 4 / rad * (y * Math.sin(2 * l0r) - 2 * e * Math.sin(m) + 4 * e * y * Math.sin(m) * Math.cos(2 * l0r) - 0.5 * y * y * Math.sin(4 * l0r) - 1.25 * e * e * Math.sin(2 * m));
  return { equationOfTime: eq, declination: Math.asin(Math.sin(epsilon * rad) * Math.sin(lambda)) / rad };
}

export function getSunriseSunset(date: string, location: GeoLocation): { sunrise: Date; sunset: Date } {
  const noonUtc = new Date(`${date}T12:00:00Z`);
  const terms = solarTerms(julianDay(noonUtc));
  const lat = location.latitude * rad;
  const decl = terms.declination * rad;
  const zenith = 90.833 * rad;
  const cosHour = (Math.cos(zenith) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
  if (cosHour < -1 || cosHour > 1) throw new RangeError("Sunrise/sunset is undefined for this location and date");
  const hourAngle = Math.acos(cosHour) / rad;
  const solarNoonUtcMinutes = 720 - 4 * location.longitude - terms.equationOfTime;
  const sunriseUtcMinutes = solarNoonUtcMinutes - 4 * hourAngle;
  const sunsetUtcMinutes = solarNoonUtcMinutes + 4 * hourAngle;
  const base = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)));
  const sunrise = new Date(base + sunriseUtcMinutes * 60_000);
  const sunset = new Date(base + sunsetUtcMinutes * 60_000);
  // NOAA's equation is a date-specific UTC estimate; guard against a rare UTC-day rollover.
  if (localDateAt(sunrise, location.timeZone) !== date) {
    const offsetDays = dayDifference(localDateAt(sunrise, location.timeZone), date);
    return { sunrise: new Date(sunrise.getTime() + offsetDays * 86_400_000), sunset: new Date(sunset.getTime() + offsetDays * 86_400_000) };
  }
  return { sunrise, sunset };
}

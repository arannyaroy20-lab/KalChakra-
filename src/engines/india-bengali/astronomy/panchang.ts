import { KARANA_NAMES, NAKSHATRA_NAMES, TITHI_NAMES, YOGA_NAMES, DEFAULT_LOCATION } from "../constants.js";
import { elongation, julianDay, siderealMoonLongitude, siderealSunLongitude } from "./meeus.js";
import { getSunriseSunset } from "./sunrise.js";
import { gregorianToBengali, getCalculationMetadata } from "../calendar-conversion.js";
import { formatLocalIso, localDateAt, localDateTimeToUtc, localTimeAt, validateLocation } from "../services/date-time.js";
import type { GeoLocation, PanchangDay, TimedLimb } from "../types.js";

const DAY_MS = 86_400_000;
const norm = (value: number) => ((value % 360) + 360) % 360;
const yogaAngle = (jd: number) => norm(siderealSunLongitude(jd) + siderealMoonLongitude(jd));
const moonAngle = (jd: number) => siderealMoonLongitude(jd);

function findLimbBoundary(start: Date, angleAt: (jd: number) => number, step: number, direction: "previous" | "next"): Date {
  const startJd = julianDay(start);
  const initial = norm(angleAt(startJd));
  let targetDistance = direction === "next" ? step - (initial % step) : initial % step;
  if (targetDistance < 1e-8) targetDistance = step;
  const progress = (jd: number) => direction === "next" ? norm(angleAt(jd) - initial) : norm(initial - angleAt(jd));
  let low = startJd;
  let high = startJd;
  const increment = 10 / 1440;
  let found = false;
  for (let i = 1; i <= 500; i++) {
    const candidate = startJd + (direction === "next" ? 1 : -1) * i * increment;
    if (progress(candidate) >= targetDistance) { high = candidate; low = candidate - (direction === "next" ? increment : -increment); found = true; break; }
  }
  if (!found) throw new Error("Could not locate a Panchang limb transition within 3.5 days");
  if (direction === "previous") [low, high] = [high, low];
  for (let i = 0; i < 42; i++) {
    const mid = (low + high) / 2;
    if (direction === "next") {
      if (progress(mid) >= targetDistance) high = mid; else low = mid;
    } else {
      if (progress(mid) >= targetDistance) low = mid; else high = mid;
    }
  }
  return new Date(((low + high) / 2 - 2_440_587.5) * DAY_MS);
}

function karanaName(index: number): string {
  if (index === 0) return KARANA_NAMES[10]!;
  if (index === 57) return KARANA_NAMES[7]!;
  if (index === 58) return KARANA_NAMES[8]!;
  if (index === 59) return KARANA_NAMES[9]!;
  return KARANA_NAMES[(index - 1) % 7]!;
}

function timedLimb(start: Date, angleAt: (jd: number) => number, step: number, number: number, name: string, location: GeoLocation): TimedLimb {
  const previous = findLimbBoundary(start, angleAt, step, "previous");
  const next = findLimbBoundary(start, angleAt, step, "next");
  return { name, number, startsAt: formatLocalIso(previous, location.timeZone), endsAt: formatLocalIso(next, location.timeZone) };
}

export function getPanchangDay(date: string, location: GeoLocation = DEFAULT_LOCATION): PanchangDay {
  validateLocation(location);
  const { sunrise, sunset } = getSunriseSunset(date, location);
  const jd = julianDay(sunrise);
  const elong = elongation(jd);
  const tithiIndex = Math.floor(elong / 12);
  const nakIndex = Math.floor(siderealMoonLongitude(jd) / (360 / 27));
  const yogaIndex = Math.floor(yogaAngle(jd) / (360 / 27));
  const karanaIndex = Math.floor(elong / 6);
  return {
    date,
    sunrise: formatLocalIso(sunrise, location.timeZone),
    sunset: formatLocalIso(sunset, location.timeZone),
    tithi: timedLimb(sunrise, elongation, 12, tithiIndex + 1, TITHI_NAMES[tithiIndex]!, location),
    nakshatra: timedLimb(sunrise, moonAngle, 360 / 27, nakIndex + 1, NAKSHATRA_NAMES[nakIndex]!, location),
    yoga: timedLimb(sunrise, yogaAngle, 360 / 27, yogaIndex + 1, YOGA_NAMES[yogaIndex]!, location),
    karana: timedLimb(sunrise, elongation, 6, karanaIndex + 1, karanaName(karanaIndex), location),
    bengaliDate: gregorianToBengali(date, location),
    calculation: getCalculationMetadata(location)
  };
}

export function getPanchangAt(instant: string | Date, location: GeoLocation = DEFAULT_LOCATION): Omit<PanchangDay, "date" | "bengaliDate"> & { instant: string; localDate: string } {
  validateLocation(location);
  const date = instant instanceof Date ? instant : new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new RangeError("Invalid instant");
  const jd = julianDay(date);
  const elong = elongation(jd);
  const ti = Math.floor(elong / 12);
  const ni = Math.floor(siderealMoonLongitude(jd) / (360 / 27));
  const yi = Math.floor(yogaAngle(jd) / (360 / 27));
  const ki = Math.floor(elong / 6);
  const localDate = localDateAt(date, location.timeZone);
  const solarTimes = getSunriseSunset(localDate, location);
  const sunrise = solarTimes.sunrise;
  return {
    instant: formatLocalIso(date, location.timeZone),
    localDate,
    sunrise: formatLocalIso(sunrise, location.timeZone),
    sunset: formatLocalIso(solarTimes.sunset, location.timeZone),
    tithi: timedLimb(date, elongation, 12, ti + 1, TITHI_NAMES[ti]!, location),
    nakshatra: timedLimb(date, moonAngle, 360 / 27, ni + 1, NAKSHATRA_NAMES[ni]!, location),
    yoga: timedLimb(date, yogaAngle, 360 / 27, yi + 1, YOGA_NAMES[yi]!, location),
    karana: timedLimb(date, elongation, 6, ki + 1, karanaName(ki), location),
    calculation: getCalculationMetadata(location)
  };
}

export function localDateTimeToInstant(date: string, time: string, location: GeoLocation = DEFAULT_LOCATION): Date {
  return localDateTimeToUtc(date, time, location.timeZone);
}

export function formatPanchangInstant(instant: Date, location: GeoLocation = DEFAULT_LOCATION): string {
  return `${localTimeAt(instant, location.timeZone)} (${location.timeZone})`;
}

const DEG = Math.PI / 180;
const norm = (value: number): number => ((value % 360) + 360) % 360;
const sinD = (value: number): number => Math.sin(value * DEG);
const cosD = (value: number): number => Math.cos(value * DEG);

export function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

export function dateFromJulianDay(jd: number): Date {
  return new Date((jd - 2_440_587.5) * 86_400_000);
}

export function lahiriAyanamsa(jd: number): number {
  const t = (jd - 2_451_545) / 36_525;
  // Chitrapaksha/Lahiri polynomial, referred to J2000. This compact form is
  // suitable for this analytical engine, not a replacement for an official ephemeris.
  return 23.8560 + 1.3969713 * t + 0.0003086 * t * t;
}

export function sunTropicalLongitude(jd: number): number {
  const t = (jd - 2_451_545) / 36_525;
  const l0 = 280.46646 + 36_000.76983 * t + 0.0003032 * t * t;
  const m = 357.52911 + 35_999.05029 * t - 0.0001537 * t * t + t * t * t / 24_490_000;
  const c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * sinD(m)
    + (0.019993 - 0.000101 * t) * sinD(2 * m) + 0.000289 * sinD(3 * m);
  const omega = 125.04 - 1934.136 * t;
  return norm(l0 + c - 0.00569 - 0.00478 * sinD(omega));
}

// Meeus, Astronomical Algorithms, ch. 47, Table 47.A (60 periodic terms).
// Columns: D, M, M', F, longitude coefficient (micro-degrees).
const LUNAR_TERMS: readonly (readonly number[])[] = [
  [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],
  [0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],
  [0,1,-1,0,-40923],[1,0,0,0,-34720],[0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],
  [0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
  [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],[2,0,2,0,3994],
  [4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
  [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],
  [2,0,1,-2,-1773],[2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
  [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],
  [2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520],[1,0,-2,0,-487],
  [2,1,0,-2,-399],[0,0,2,-2,-381],[1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],
  [2,-1,2,0,327],[0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294],[2,0,-1,-2,0]
];

export function moonTropicalLongitude(jd: number): number {
  const t = (jd - 2_451_545) / 36_525;
  const lp = 218.3164477 + (481267.88123421 + (-0.0015786 + (1 / 538841 - t / 65194000) * t) * t) * t;
  const d = 297.8501921 + (445267.1114034 + (-0.0018819 + (1 / 545868 - t / 113065000) * t) * t) * t;
  const m = 357.5291092 + (35999.0502909 + (-0.0001536 + t / 24490000) * t) * t;
  const mp = 134.9633964 + (477198.8675055 + (0.0087414 + (1 / 69699 - t / 14712000) * t) * t) * t;
  const f = 93.2720950 + (483202.0175233 + (-0.0036539 + (-1 / 3526000 + t / 863310000) * t) * t) * t;
  const e = 1 - 0.002516 * t - 0.0000074 * t * t;
  let sigma = 0;
  for (const [dc, mc, mpc, fc, coefficient] of LUNAR_TERMS) {
    const eccentricity = Math.abs(mc!) === 1 ? e : Math.abs(mc!) === 2 ? e * e : 1;
    sigma += coefficient! * eccentricity * sinD(dc! * d + mc! * m + mpc! * mp + fc! * f);
  }
  const a1 = 119.75 + 131.849 * t;
  const a2 = 53.09 + 479264.290 * t;
  const a3 = 313.45 + 481266.484 * t;
  sigma += 3958 * sinD(a1) + 1962 * sinD(lp - f) + 318 * sinD(a2);
  const omega = 125.04 - 1934.136 * t;
  const deltaPsiArcSeconds = -17.20 * sinD(omega) - 1.32 * sinD(2 * (280.4665 + 36000.7698 * t))
    - 0.23 * sinD(2 * lp) + 0.21 * sinD(2 * omega);
  return norm(lp + sigma / 1_000_000 + deltaPsiArcSeconds / 3600);
}

export function siderealSunLongitude(jd: number): number {
  return norm(sunTropicalLongitude(jd) - lahiriAyanamsa(jd));
}

export function siderealMoonLongitude(jd: number): number {
  return norm(moonTropicalLongitude(jd) - lahiriAyanamsa(jd));
}

export function elongation(jd: number): number {
  return norm(siderealMoonLongitude(jd) - siderealSunLongitude(jd));
}

import type { EkadashiObservance } from "../types.js";
/** Only published, verified Parana windows are enforceable; unknown windows are never inferred. */
export function isWithinPublishedParanaWindow(observance:EkadashiObservance,localTime:string):boolean {
  if(observance.verification!=="verified-reference"||!observance.paranaStart||!observance.paranaEnd) return false;
  if(!/^\d{2}:\d{2}$/.test(localTime)) throw new RangeError("Time must use HH:mm");
  return localTime>=observance.paranaStart&&localTime<=observance.paranaEnd;
}

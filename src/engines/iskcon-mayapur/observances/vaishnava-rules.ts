import type { EkadashiKind, ObservanceDecisionInput } from "../types.js";
/** Sunrise/arunodaya decision layer. Inputs are astronomical facts, never inferred festival labels. */
export function decideEkadashiObservance(input: ObservanceDecisionInput & { ekadashiAtPreviousSunrise?: boolean }): { observe: boolean; kind: EkadashiKind | null; notes: string[] } {
  if (input.dashamiAtArunodaya && input.dvadashiAtSunrise) return { observe: true, kind: "mahadvadashi", notes: ["Dashami at arunodaya on the preceding Ekadashi tithi day; Dvadashi sunrise is a Mahadvadashi candidate."] };
  if (input.ekadashiSkippedAtSunrise && input.dvadashiAtSunrise) return { observe: true, kind: "kshaya-observance", notes: ["Ekadashi is absent at sunrise between Dashami and Dvadashi; this is a kshaya candidate requiring subtype verification."] };
  if (input.dashamiAtArunodaya) return { observe: false, kind: null, notes: ["Dashami at arunodaya: this is not Shuddha Ekadashi."] };
  if (input.ekadashiAtSunrise && input.ekadashiAtNextSunrise) return { observe: true, kind: "vriddhi-ekadashi", notes: ["Ekadashi prevails at consecutive sunrises; the first sunrise is selected as a provisional Vriddhi observance."] };
  if (input.ekadashiAtSunrise) return { observe: true, kind: "shuddha-ekadashi", notes: ["Ekadashi at sunrise without Dashami at arunodaya."] };
  return { observe: false, kind: null, notes: [] };
}

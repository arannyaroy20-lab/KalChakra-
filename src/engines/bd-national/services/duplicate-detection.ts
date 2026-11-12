import type { BangladeshNationalEvent } from "../types.js";

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export interface DuplicatePair {
  firstId: string;
  secondId: string;
  reason: "same-id" | "same-title-and-range";
}

export function detectDuplicateEvents(
  events: readonly BangladeshNationalEvent[]
): DuplicatePair[] {
  const duplicates: DuplicatePair[] = [];
  for (let i = 0; i < events.length; i += 1) {
    const a = events[i]!;
    for (let j = i + 1; j < events.length; j += 1) {
      const b = events[j]!;
      if (a.id === b.id) {
        duplicates.push({ firstId: a.id, secondId: b.id, reason: "same-id" });
        continue;
      }
      const sameTitle =
        normalize(a.title.bn) === normalize(b.title.bn) ||
        normalize(a.title.en) === normalize(b.title.en);
      if (sameTitle && a.startDate === b.startDate && a.endDate === b.endDate) {
        duplicates.push({
          firstId: a.id,
          secondId: b.id,
          reason: "same-title-and-range"
        });
      }
    }
  }
  return duplicates;
}

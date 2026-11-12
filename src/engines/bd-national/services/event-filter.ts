import type { BangladeshNationalEvent, EventQuery } from "../types.js";

export function filterEvents(
  events: readonly BangladeshNationalEvent[],
  query: EventQuery = {}
): BangladeshNationalEvent[] {
  return events.filter((event) => {
    if (query.from && event.endDate < query.from) return false;
    if (query.to && event.startDate > query.to) return false;
    if (query.categories && !query.categories.includes(event.category)) return false;
    if (query.holidayStatuses && !query.holidayStatuses.includes(event.holidayStatus)) return false;
    if (query.verificationStatuses &&
        !query.verificationStatuses.includes(event.verificationStatus)) return false;
    if (query.includeUnverified === false && event.verificationStatus === "unverified") return false;
    return true;
  }).sort((a, b) =>
    a.startDate.localeCompare(b.startDate) || a.title.en.localeCompare(b.title.en)
  );
}

import type { BangladeshNationalEvent, EventQuery } from "./types.js";
import { loadYearEvents, getAvailableYears, getDataset } from "./services/event-loader.js";
import { filterEvents } from "./services/event-filter.js";
import { validateEvents } from "./services/event-validator.js";
import { detectDuplicateEvents } from "./services/duplicate-detection.js";

export class BangladeshNationalCalendarEngine {
  readonly id = "bd-national" as const;
  readonly name = "Bangladesh National Calendar";

  getAvailableYears(): number[] {
    return getAvailableYears();
  }

  getYearMetadata(year: number) {
    return getDataset(year).metadata;
  }

  getEvents(year: number, query: EventQuery = {}): BangladeshNationalEvent[] {
    return filterEvents(loadYearEvents(year), query);
  }

  getEventsInRange(from: string, to: string): BangladeshNationalEvent[] {
    const firstYear = Number(from.slice(0, 4));
    const lastYear = Number(to.slice(0, 4));
    const results: BangladeshNationalEvent[] = [];
    for (let year = firstYear; year <= lastYear; year += 1) {
      try {
        results.push(...loadYearEvents(year));
      } catch (error) {
        if (!(error instanceof Error) || error.name !== "DatasetNotFoundError") throw error;
      }
    }
    return filterEvents(results, { from, to });
  }

  validate(year: number) {
    return validateEvents(loadYearEvents(year));
  }

  findDuplicates(year: number) {
    return detectDuplicateEvents(loadYearEvents(year));
  }
}

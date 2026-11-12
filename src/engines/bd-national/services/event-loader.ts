import { YEAR_DATASETS, AVAILABLE_YEARS } from "../data/registry.js";
import type { BangladeshNationalEvent, YearDataset } from "../types.js";
import { validateEvents } from "./event-validator.js";
import { detectDuplicateEvents } from "./duplicate-detection.js";

export class DatasetNotFoundError extends Error {
  constructor(year: number) {
    super(`No Bangladesh National Calendar dataset is registered for ${year}.`);
    this.name = "DatasetNotFoundError";
  }
}

export class DatasetIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatasetIntegrityError";
  }
}

export function getDataset(year: number): YearDataset {
  const dataset = YEAR_DATASETS[year];
  if (!dataset) throw new DatasetNotFoundError(year);
  return dataset;
}

export function loadYearEvents(year: number): BangladeshNationalEvent[] {
  const dataset = getDataset(year);
  const issues = validateEvents(dataset.events);
  if (issues.length) {
    throw new DatasetIntegrityError(
      `Dataset ${year} contains validation issues: ${issues.map((x) => `${x.eventId}.${x.field}: ${x.message}`).join("; ")}`
    );
  }
  const duplicates = detectDuplicateEvents(dataset.events);
  if (duplicates.length) {
    throw new DatasetIntegrityError(
      `Dataset ${year} contains duplicate events: ${duplicates.map((x) => `${x.firstId}/${x.secondId}`).join(", ")}`
    );
  }
  return [...dataset.events];
}

export function getAvailableYears(): number[] {
  return [...AVAILABLE_YEARS];
}

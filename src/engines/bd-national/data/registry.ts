import data2026 from "./2026.json" with { type: "json" };
import data2027 from "./2027.json" with { type: "json" };
import type { YearDataset } from "../types.js";

export const YEAR_DATASETS: Readonly<Record<number, YearDataset>> = {
  2026: data2026 as YearDataset,
  2027: data2027 as YearDataset
};

export const AVAILABLE_YEARS = Object.freeze(
  Object.keys(YEAR_DATASETS).map(Number).sort((a, b) => a - b)
);

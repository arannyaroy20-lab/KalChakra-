/** Bangladesh's revised Bangla Academy calendar (2019 revision). */
export interface BengaliDate {
  /** Bengali era year (Bangabda). */
  year: number;
  /** One-based month number: 1 = Boishakh, 12 = Chaitra. */
  month: number;
  /** One-based day of the Bengali month. */
  day: number;
  monthName: { bn: string; en: string };
  weekday: { bn: string; en: string };
  /** Gregorian date represented by this Bengali date. */
  gregorianDate: string;
}

export interface BengaliYearInfo {
  year: number;
  gregorianStartYear: number;
  startDate: string;
  endDate: string;
  isLeapYear: boolean;
  totalDays: number;
  monthLengths: readonly number[];
}

export interface BengaliDateInput {
  year: number;
  month: number;
  day: number;
}

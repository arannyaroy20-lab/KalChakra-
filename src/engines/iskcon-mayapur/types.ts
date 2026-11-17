export interface MayapurLocation { name: string; latitude: number; longitude: number; elevationMeters?: number; timeZone: string }
export interface CalculationMetadata { method: string; location: MayapurLocation; timeZone: string; source: string; verification: "verified-reference" | "calculated-unverified"; precisionNote: string }
export type TithiPaksha = "shukla" | "krishna";
export interface TithiState { index: number; number: number; paksha: TithiPaksha; name: string; startsAt: string; endsAt: string }
export interface AstronomicalDay { date: string; sunrise: string; sunset: string; tithi: TithiState; nakshatra: string; yoga: string; karana: string; moonrise: null; moonset: null; calculation: CalculationMetadata }
export type EkadashiKind = "shuddha-ekadashi" | "mahadvadashi" | "vriddhi-ekadashi" | "kshaya-observance";
export interface EkadashiObservance { name: string; fastDate: string; paranaDate: string; paranaStart: string | null; paranaEnd: string | null; kind: EkadashiKind; mahadvadashiType?: string; source: string; verification: "verified-reference" | "calculated-unverified"; notes: string[] }
export interface MayapurFestival { date: string; name: string; category: "festival" | "appearance" | "disappearance" | "monthly-observance" | "sankranti" | "fast"; fasting?: string; source: string; verification: "verified-reference" | "calculated-unverified" }
export interface ObservanceDecisionInput { dashamiAtArunodaya: boolean; ekadashiAtSunrise: boolean; ekadashiAtNextSunrise: boolean; ekadashiAtPreviousSunrise?: boolean; dvadashiAtSunrise: boolean; ekadashiSkippedAtSunrise: boolean; mahadvadashiType?: string }

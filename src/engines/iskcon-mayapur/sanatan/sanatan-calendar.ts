import type { AstronomicalDay, EkadashiObservance, MayapurFestival, MayapurLocation } from "../types.js";
import { DEFAULT_LOCATION } from "../constants.js";
import { getMayapurPanchang } from "../astronomy/panchang.js";
import { addDays } from "../services/date-time.js";
import { gregorianToBengali as indiaGregorianToBengali } from "../../india-bengali/calendar-conversion.js";
import type { DisplayLanguage } from "../../../integration/types.js";

export type HinduCalendarMode = "sanatan" | "iskcon";

const SANATAN_SOURCE = "Drik Panchang & Bengali Panjika (Astronomical Tithi Engine)";

interface SanatanFestivalEntry {
  date: string;
  name: { bn: string; en: string };
  category: MayapurFestival["category"];
  fasting?: string;
  lunarTag?: "purnima" | "amavasya";
}

const VERIFIED_SANATAN_FESTIVALS: readonly SanatanFestivalEntry[] = [
  // 2026
  { date: "2026-01-14", name: { bn: "মকর সংক্রান্তি (পৌষ সংক্রান্তি)", en: "Makar Sankranti (Poush Sankranti)" }, category: "festival" },
  { date: "2026-01-23", name: { bn: "সরস্বতী পূজা (বসন্ত পঞ্চমী)", en: "Saraswati Puja (Vasant Panchami)" }, category: "festival" },
  { date: "2026-02-15", name: { bn: "মহাশিবরাত্রি", en: "Maha Shivaratri" }, category: "festival", fasting: "fast-today" },
  { date: "2026-03-03", name: { bn: "দোলযাত্রা (ফাল্গুনী পূর্ণিমা)", en: "Dol Jatra (Holi)" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-03-19", name: { bn: "বাসন্তী নবরাত্রি আরম্ভ", en: "Chaitra Navratri Begins" }, category: "monthly-observance" },
  { date: "2026-03-25", name: { bn: "বাসন্তী সপ্তমী", en: "Basanti Puja Saptami" }, category: "festival" },
  { date: "2026-03-26", name: { bn: "বাসন্তী মহাষ্টমী ও রামনবমী", en: "Basanti Ashtami & Rama Navami" }, category: "festival" },
  { date: "2026-03-27", name: { bn: "বাসন্তী মহানবমী ও রামনবমী (উদয়া)", en: "Basanti Navami & Rama Navami (Udaya)" }, category: "festival" },
  { date: "2026-03-28", name: { bn: "বাসন্তী দশমী", en: "Basanti Dashami" }, category: "festival" },
  { date: "2026-04-13", name: { bn: "চৈত্র সংক্রান্তি ও চরক পূজা", en: "Chaitra Sankranti & Charak Puja" }, category: "festival" },
  { date: "2026-04-15", name: { bn: "পহেলা বৈশাখ (পঞ্জিকা)", en: "Pohela Boishakh (Panjika)" }, category: "festival" },
  { date: "2026-04-19", name: { bn: "অক্ষয় তৃতীয়া", en: "Akshaya Tritiya" }, category: "festival" },
  { date: "2026-05-01", name: { bn: "বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)", en: "Buddha Purnima" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-06-20", name: { bn: "জামাইষষ্ঠী (অরণ্যষষ্ঠী)", en: "Jamai Sasthi" }, category: "festival" },
  { date: "2026-06-29", name: { bn: "স্নানযাত্রা (জ্যৈষ্ঠী পূর্ণিমা)", en: "Snan Yatra" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-07-16", name: { bn: "শ্রীশ্রী জগন্নাথদেবের রথযাত্রা", en: "Ratha Yatra" }, category: "festival" },
  { date: "2026-07-24", name: { bn: "উল্টোরথ (পুনর্যাত্রা)", en: "Ulto Rath (Bahuda Yatra)" }, category: "festival" },
  { date: "2026-07-29", name: { bn: "গুরু পূর্ণিমা (আষাঢ়ী পূর্ণিমা)", en: "Guru Purnima" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-08-28", name: { bn: "রাখী পূর্ণিমা ও ঝুলনযাত্রা সমাপ্তি", en: "Rakhi Purnima & Raksha Bandhan" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-09-04", name: { bn: "শ্রীকৃষ্ণ জন্মাষ্টমী", en: "Sri Krishna Janmashtami" }, category: "festival", fasting: "fast-till-midnight" },
  { date: "2026-09-14", name: { bn: "গণেশ চতুর্থী", en: "Ganesh Chaturthi" }, category: "festival" },
  { date: "2026-09-17", name: { bn: "বিশ্বকর্মা পূজা (ভাদ্র সংক্রান্তি)", en: "Vishwakarma Puja" }, category: "festival" },
  { date: "2026-10-10", name: { bn: "মহালয়া (সর্বপিতৃ অমাবস্যা)", en: "Mahalaya (Sarva Pitru Amavasya)" }, category: "festival", lunarTag: "amavasya" },
  { date: "2026-10-16", name: { bn: "শারদীয়া দুর্গাপূজা — মহাষষ্ঠী", en: "Durga Puja — Maha Shashthi" }, category: "festival" },
  { date: "2026-10-17", name: { bn: "দুর্গাপূজা — সপ্তমী কল্পারম্ভ", en: "Durga Puja — Saptami Kalparambha" }, category: "festival" },
  { date: "2026-10-18", name: { bn: "দুর্গাপূজা — মহাসপ্তমী", en: "Durga Puja — Maha Saptami" }, category: "festival" },
  { date: "2026-10-19", name: { bn: "দুর্গাপূজা — মহাষ্টমী ও সন্ধিপূজা", en: "Durga Puja — Maha Ashtami" }, category: "festival" },
  { date: "2026-10-20", name: { bn: "দুর্গাপূজা — মহানবমী", en: "Durga Puja — Maha Navami" }, category: "festival" },
  { date: "2026-10-21", name: { bn: "বিজয়া দশমী", en: "Vijaya Dashami" }, category: "festival" },
  { date: "2026-10-25", name: { bn: "কোজাগরী লক্ষ্মীপূজা (শারদ পূর্ণিমা)", en: "Kojagari Lakshmi Puja" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-11-06", name: { bn: "ধনতেরাস (ধনত্রয়োদশী)", en: "Dhanteras" }, category: "festival" },
  { date: "2026-11-07", name: { bn: "ভূতচতুর্দশী", en: "Bhoot Chaturdashi" }, category: "monthly-observance" },
  { date: "2026-11-08", name: { bn: "শ্যামাপূজা (কালীপূজা) ও দীপাবলি", en: "Kali Puja (Shyama Puja) & Deepavali" }, category: "festival", lunarTag: "amavasya" },
  { date: "2026-11-11", name: { bn: "ভ্রাতৃদ্বিতীয়া (ভাইফোঁটা)", en: "Bhai Phonta (Bhratridwitiya)" }, category: "festival" },
  { date: "2026-11-16", name: { bn: "কার্তিক পূজা (কার্তিক সংক্রান্তি)", en: "Kartik Puja" }, category: "festival" },
  { date: "2026-11-19", name: { bn: "জগদ্ধাত্রী পূজা (মহা নবমী)", en: "Jagaddhatri Puja" }, category: "festival" },
  { date: "2026-11-24", name: { bn: "রাসযাত্রা (কার্তিকী পূর্ণিমা)", en: "Ras Yatra (Kartik Purnima)" }, category: "festival", lunarTag: "purnima" },
  { date: "2026-12-20", name: { bn: "গীতা জয়ন্তী", en: "Gita Jayanti" }, category: "festival" },

  // 2027
  { date: "2027-01-14", name: { bn: "মকর সংক্রান্তি (পৌষ সংক্রান্তি)", en: "Makar Sankranti (Poush Sankranti)" }, category: "festival" },
  { date: "2027-02-11", name: { bn: "সরস্বতী পূজা (বসন্ত পঞ্চমী)", en: "Saraswati Puja (Vasant Panchami)" }, category: "festival" },
  { date: "2027-03-06", name: { bn: "মহাশিবরাত্রি", en: "Maha Shivaratri" }, category: "festival", fasting: "fast-today" },
  { date: "2027-03-22", name: { bn: "দোলযাত্রা (ফাল্গুনী পূর্ণিমা)", en: "Dol Jatra (Holi)" }, category: "festival", lunarTag: "purnima" },
  { date: "2027-04-07", name: { bn: "বাসন্তী নবরাত্রি আরম্ভ", en: "Chaitra Navratri Begins" }, category: "monthly-observance" },
  { date: "2027-04-13", name: { bn: "নীলষষ্ঠী", en: "Nil Sasthi" }, category: "festival" },
  { date: "2027-04-14", name: { bn: "চৈত্র সংক্রান্তি ও চরক পূজা", en: "Chaitra Sankranti & Charak Puja" }, category: "festival" },
  { date: "2027-04-15", name: { bn: "পহেলা বৈশাখ (পঞ্জিকা) ও রামনবমী", en: "Pohela Boishakh (Panjika) & Rama Navami" }, category: "festival" },
  { date: "2027-05-10", name: { bn: "অক্ষয় তৃতীয়া", en: "Akshaya Tritiya" }, category: "festival" },
  { date: "2027-05-20", name: { bn: "বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)", en: "Buddha Purnima" }, category: "festival", lunarTag: "purnima" },
  { date: "2027-06-10", name: { bn: "জামাইষষ্ঠী (অরণ্যষষ্ঠী)", en: "Jamai Sasthi" }, category: "festival" },
  { date: "2027-06-16", name: { bn: "স্নানযাত্রা (জ্যৈষ্ঠী পূর্ণিমা)", en: "Snan Yatra" }, category: "festival", lunarTag: "purnima" },
  { date: "2027-07-05", name: { bn: "শ্রীশ্রী জগন্নাথদেবের রথযাত্রা", en: "Ratha Yatra" }, category: "festival" },
  { date: "2027-07-18", name: { bn: "গুরু পূর্ণিমা (আষাঢ়ী পূর্ণিমা)", en: "Guru Purnima" }, category: "festival", lunarTag: "purnima" },
  { date: "2027-08-17", name: { bn: "রাখী পূর্ণিমা (রক্ষা বন্ধন)", en: "Rakhi Purnima (Raksha Bandhan)" }, category: "festival", lunarTag: "purnima" },
  { date: "2027-08-24", name: { bn: "শ্রীকৃষ্ণ জন্মাষ্টমী", en: "Sri Krishna Janmashtami" }, category: "festival", fasting: "fast-till-midnight" },
  { date: "2027-09-04", name: { bn: "গণেশ চতুর্থী", en: "Ganesh Chaturthi" }, category: "festival" },
  { date: "2027-09-17", name: { bn: "বিশ্বকর্মা পূজা (ভাদ্র সংক্রান্তি)", en: "Vishwakarma Puja" }, category: "festival" },
  { date: "2027-09-29", name: { bn: "মহালয়া (সর্বপিতৃ অমাবস্যা)", en: "Mahalaya (Sarva Pitru Amavasya)" }, category: "festival", lunarTag: "amavasya" },
  { date: "2027-10-05", name: { bn: "শারদীয়া দুর্গাপূজা — মহাষষ্ঠী", en: "Durga Puja — Maha Shashthi" }, category: "festival" },
  { date: "2027-10-06", name: { bn: "দুর্গাপূজা — মহাসপ্তমী", en: "Durga Puja — Maha Saptami" }, category: "festival" },
  { date: "2027-10-07", name: { bn: "দুর্গাপূজা — মহাষ্টমী", en: "Durga Puja — Maha Ashtami" }, category: "festival" },
  { date: "2027-10-08", name: { bn: "দুর্গাপূজা — সন্ধিপূজা ও নবমী", en: "Durga Puja — Sandhi Puja & Navami" }, category: "festival" },
  { date: "2027-10-09", name: { bn: "দুর্গাপূজা — মহানবমী (উদয়া)", en: "Durga Puja — Maha Navami (Udaya)" }, category: "festival" },
  { date: "2027-10-10", name: { bn: "বিজয়া দশমী", en: "Vijaya Dashami" }, category: "festival" },
  { date: "2027-10-14", name: { bn: "কোজাগরী লক্ষ্মীপূজা (শারদ পূর্ণিমা)", en: "Kojagari Lakshmi Puja" }, category: "festival", lunarTag: "purnima" },
  { date: "2027-10-27", name: { bn: "ভূতচতুর্দশী ও ধনত্রয়োদশী", en: "Bhoot Chaturdashi & Dhanteras" }, category: "festival" },
  { date: "2027-10-28", name: { bn: "শ্যামাপূজা (কালীপূজা) ও দীপাবলি", en: "Kali Puja (Shyama Puja) & Deepavali" }, category: "festival", lunarTag: "amavasya" },
  { date: "2027-10-31", name: { bn: "ভ্রাতৃদ্বিতীয়া (ভাইফোঁটা)", en: "Bhai Phonta (Bhratridwitiya)" }, category: "festival" },
  { date: "2027-11-07", name: { bn: "জগদ্ধাত্রী পূজা (মহা নবমী)", en: "Jagaddhatri Puja" }, category: "festival" },
  { date: "2027-11-17", name: { bn: "কার্তিক পূজা (কার্তিক সংক্রান্তি)", en: "Kartik Puja" }, category: "festival" }
];

// Indexed by Bengali solar month (1 = Boishakh .. 12 = Chaitra)
const EKADASHI_BY_MONTH: Record<number, { shukla: { bn: string; en: string }; krishna: { bn: string; en: string } }> = {
  1: { shukla: { bn: "মোহিনী একাদশী", en: "Mohini Ekadashi" }, krishna: { bn: "বরূথিনী একাদশী", en: "Varuthini Ekadashi" } },
  2: { shukla: { bn: "নির্জলা একাদশী", en: "Nirjala Ekadashi" }, krishna: { bn: "অপরা একাদশী", en: "Apara Ekadashi" } },
  3: { shukla: { bn: "দেবশয়নী একাদশী", en: "Devshayani Ekadashi" }, krishna: { bn: "যোগিনী একাদশী", en: "Yogini Ekadashi" } },
  4: { shukla: { bn: "পবিত্রারোপণা একাদশী", en: "Pavitraropana Ekadashi" }, krishna: { bn: "কামিকা একাদশী", en: "Kamika Ekadashi" } },
  5: { shukla: { bn: "পার্শ্ব একাদশী", en: "Parsva Ekadashi" }, krishna: { bn: "অন্নদা / অজা একাদশী", en: "Annada / Aja Ekadashi" } },
  6: { shukla: { bn: "পাপাঙ্কুশা একাদশী", en: "Papankusha Ekadashi" }, krishna: { bn: "ইন্দিরা একাদশী", en: "Indira Ekadashi" } },
  7: { shukla: { bn: "উত্থান একাদশী", en: "Utthana Ekadashi" }, krishna: { bn: "রমা একাদশী", en: "Rama Ekadashi" } },
  8: { shukla: { bn: "মোক্ষদা একাদশী", en: "Mokshada Ekadashi" }, krishna: { bn: "উৎপন্না একাদশী", en: "Utpanna Ekadashi" } },
  9: { shukla: { bn: "পুত্রদা একাদশী", en: "Putrada Ekadashi" }, krishna: { bn: "সফলা একাদশী", en: "Saphala Ekadashi" } },
  10: { shukla: { bn: "ভৈমী / জয়া একাদশী", en: "Bhaimi / Jaya Ekadashi" }, krishna: { bn: "ষটতিলা একাদশী", en: "Shat-tila Ekadashi" } },
  11: { shukla: { bn: "আমলকী একাদশী", en: "Amalaki Ekadashi" }, krishna: { bn: "বিজয়া একাদশী", en: "Vijaya Ekadashi" } },
  12: { shukla: { bn: "কামদা একাদশী", en: "Kamada Ekadashi" }, krishna: { bn: "পাপমোচনী একাদশী", en: "Papamocani Ekadashi" } }
};

function findLunarMonthBounds(date: string, location: MayapurLocation): { startDate: string; endDate: string } {
  const isNewMoonDay = (iso: string): boolean => {
    const p = getMayapurPanchang(iso, location);
    if (p.tithi.index === 29) return true;
    const next = getMayapurPanchang(addDays(iso, 1), location);
    return p.tithi.index >= 27 && next.tithi.index <= 1;
  };
  let startDate = date;
  for (let i = 1; i <= 31; i++) {
    const candidate = addDays(date, -i);
    if (isNewMoonDay(candidate)) {
      startDate = candidate;
      break;
    }
  }
  let endDate = date;
  for (let i = 1; i <= 31; i++) {
    const candidate = addDays(date, i);
    if (isNewMoonDay(candidate)) {
      endDate = candidate;
      break;
    }
  }
  return { startDate, endDate };
}

function getSmartaEkadashiName(date: string, paksha: "shukla" | "krishna", language: DisplayLanguage, location: MayapurLocation): string {
  const { startDate, endDate } = findLunarMonthBounds(date, location);
  const startMonth = indiaGregorianToBengali(startDate, location).month;
  const endMonth = indiaGregorianToBengali(endDate, location).month;
  if (startMonth === endMonth) {
    return paksha === "shukla"
      ? (language === "bn" ? "পদ্মিনী একাদশী" : "Padmini Ekadashi")
      : (language === "bn" ? "পরমা একাদশী" : "Parama Ekadashi");
  }
  const monthIndex = paksha === "shukla" ? startMonth : (startMonth % 12) + 1;
  const entry = EKADASHI_BY_MONTH[monthIndex];
  if (!entry) return language === "bn" ? "একাদশী ব্রত" : "Ekadashi Vrata";
  return entry[paksha][language];
}

function hasNearbyLunarFestival(date: string, tag: "purnima" | "amavasya"): boolean {
  const prev = addDays(date, -1);
  const next = addDays(date, 1);
  return VERIFIED_SANATAN_FESTIVALS.some(f => f.lunarTag === tag && (f.date === date || f.date === prev || f.date === next));
}

export function getSanatanEventsForDate(
  date: string,
  language: DisplayLanguage,
  location: MayapurLocation = DEFAULT_LOCATION
): (MayapurFestival | EkadashiObservance)[] {
  const events: (MayapurFestival | EkadashiObservance)[] = [];

  for (const item of VERIFIED_SANATAN_FESTIVALS) {
    if (item.date === date) {
      events.push({
        date,
        name: item.name[language],
        category: item.category,
        ...(item.fasting ? { fasting: item.fasting } : {}),
        source: SANATAN_SOURCE,
        verification: "verified-reference"
      });
    }
  }

  const prevDate = addDays(date, -1);
  const curr = getMayapurPanchang(date, location);
  const prev = getMayapurPanchang(prevDate, location);

  // Smarta Ekadashi: first sunrise with Ekadashi tithi, or skipped Ekadashi between prev and curr sunrise
  const isSunriseEkadashi = curr.tithi.number === 11 && prev.tithi.number !== 11;
  const isSkippedEkadashi = curr.tithi.number === 12 && ((curr.tithi.index - prev.tithi.index + 30) % 30 === 2);
  if (isSunriseEkadashi || isSkippedEkadashi) {
    const paksha = curr.tithi.paksha;
    events.push({
      name: getSmartaEkadashiName(date, paksha, language, location),
      fastDate: date,
      paranaDate: addDays(date, 1),
      paranaStart: null,
      paranaEnd: null,
      kind: isSkippedEkadashi ? "kshaya-observance" : "shuddha-ekadashi",
      source: SANATAN_SOURCE,
      verification: "calculated-unverified",
      notes: [language === "bn" ? "সূর্যোদয় তিথি অনুযায়ী স্মার্ত একাদশী গণনা।" : "Smarta Ekadashi calculated from local sunrise tithi."]
    });
  }

  // Monthly Purnima (index 14) when not already covered by a Purnima festival in +/-1 day window
  const isPurnima = (curr.tithi.index === 14 && prev.tithi.index !== 14) || (curr.tithi.index === 15 && prev.tithi.index === 13);
  if (isPurnima && !hasNearbyLunarFestival(date, "purnima")) {
    events.push({
      date,
      name: language === "bn" ? "পূর্ণিমা" : "Purnima",
      category: "monthly-observance",
      source: SANATAN_SOURCE,
      verification: "calculated-unverified"
    });
  }

  // Monthly Amavasya (index 29) when not already covered by an Amavasya festival in +/-1 day window
  const isAmavasya = (curr.tithi.index === 29 && prev.tithi.index !== 29) || (curr.tithi.index === 0 && prev.tithi.index === 28);
  if (isAmavasya && !hasNearbyLunarFestival(date, "amavasya")) {
    events.push({
      date,
      name: language === "bn" ? "অমাবস্যা" : "Amavasya",
      category: "monthly-observance",
      source: SANATAN_SOURCE,
      verification: "calculated-unverified"
    });
  }

  return events;
}

const ISKCON_EVENT_BN: Record<string, string> = {
  "Gaura Purnima": "গৌর পূর্ণিমা",
  "Rama Navami": "রামনবমী",
  "Nrisimha Chaturdasi": "নৃসিংহ চতুর্দশী",
  "Ratha Yatra": "রথযাত্রা",
  "Balarama Purnima": "বলরাম পূর্ণিমা",
  "Sri Krishna Janmastami": "শ্রীকৃষ্ণ জন্মাষ্টমী",
  "Srila Prabhupada Vyasa-puja": "শ্রীল প্রভুপাদ ব্যাসপূজা",
  "Radhastami": "রাধাষ্টমী",
  "Govardhan Puja": "গোবর্ধন পূজা",
  "Srila Prabhupada Disappearance Day": "শ্রীল প্রভুপাদ তিরোভাব তিথি",
  "Trisprisa Mahadvadasi": "ত্রিস্পৃশা মহাদ্বাদশী",
  "Utthana Ekadasi": "উত্থান একাদশী",
  "Sri Krishna Rasayatra": "শ্রীকৃষ্ণ রাসযাত্রা",
  "Bhisma Pancaka Beginning": "ভীষ্মপঞ্চক আরম্ভ",
  "Bhisma Pancaka Last Day": "ভীষ্মপঞ্চক সমাপ্তি",
  "End of Caturmasya": "চাতুর্মাস্যা সমাপ্তি",
  "Marriage of Tulasi and Salagram": "তুলসী-শালগ্রাম বিবাহ",
  "Fourth Month of Caturmasya Begins": "চাতুর্মাস্যা চতুর্থ মাস আরম্ভ",
  "Third Month of Caturmasya Begins": "চাতুর্মাস্যা তৃতীয় মাস আরম্ভ",
  "Second Month of Caturmasya Begins": "চাতুর্মাস্যা দ্বিতীয় মাস আরম্ভ",
  "First Month of Caturmasya Begins": "চাতুর্মাস্যা প্রথম মাস আরম্ভ",
  "Purusottam-Adhika Masa Begins": "পুরুষোত্তম-অধিক মাস আরম্ভ",
  "Purusottam-Adhika Masa Completes": "পুরুষোত্তম-অধিক মাস সমাপ্তি",
  "Katyayani Vrata Begins": "কাত্যায়নী ব্রত আরম্ভ",
  "Gita Jayanti": "গীতা জয়ন্তী",
  "Sri Advaita Acarya Appearance": "শ্রীঅদ্বৈত আচার্যের আবির্ভাব",
  "Sri Nityananda Prabhu Appearance": "শ্রীনিত্যানন্দ প্রভুর আবির্ভাব",
  "Papamocani Ekadasi": "পাপমোচনী একাদশী",
  "Kamada Ekadasi": "কামদা একাদশী",
  "Varuthini Ekadasi": "বরূথিনী একাদশী",
  "Mohini Ekadasi": "মোহিনী একাদশী",
  "Apara Ekadasi": "অপরা একাদশী",
  "Padmini Ekadasi": "পদ্মিনী একাদশী",
  "Parama Ekadasi": "পরমা একাদশী",
  "Pandava Nirjala Ekadasi": "পাণ্ডব নির্জলা একাদশী",
  "Yogini Ekadasi": "যোগিনী একাদশী",
  "Sayana Ekadasi": "শয়ন একাদশী",
  "Kamika Ekadasi": "কামিকা একাদশী",
  "Pavitraropana Ekadasi": "পবিত্রারোপণা একাদশী",
  "Annada Ekadasi": "অন্নদা একাদশী",
  "Parsva Ekadasi": "পার্শ্ব একাদশী",
  "Indira Ekadasi": "ইন্দিরা একাদশী",
  "Pasankusa Ekadasi": "পাশাঙ্কুশা একাদশী",
  "Rama Ekadasi": "রমা একাদশী",
  "Utpanna Ekadasi": "উৎপন্না একাদশী",
  "Mokshada Ekadasi": "মোক্ষদা একাদশী",
  "Saphala Ekadasi": "সফলা একাদশী",
  "Putrada Ekadasi": "পুত্রদা একাদশী",
  "Sat-tila Ekadasi": "ষটতিলা একাদশী",
  "Bhaimi Ekadasi": "ভৈমী একাদশী",
  "Vijaya Ekadasi": "বিজয়া একাদশী",
  "Amalaki-Vrata Ekadasi": "আমলকী-ব্রত একাদশী",
  "Ekadashi (calculated candidate)": "একাদশী (গণনাকৃত)"
};

export function localizeIskconEventName(name: string, language: DisplayLanguage): string {
  return language === "bn" ? (ISKCON_EVENT_BN[name] ?? name) : name;
}

const TITHI_NUM_BN = [
  "প্রতিপদ", "দ্বিতীয়া", "তৃতীয়া", "চতুর্থী", "পঞ্চমী", "ষষ্ঠী", "সপ্তমী", "অষ্টমী",
  "নবমী", "দশমী", "একাদশী", "দ্বাদশী", "ত্রয়োদশী", "চতুর্দশী", "পূর্ণিমা"
] as const;

const TITHI_NUM_EN = [
  "Pratipada", "Dvitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami",
  "Navami", "Dashami", "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", "Purnima"
] as const;

const NAKSHATRA_BN: Record<string, string> = {
  "Ashvini": "অশ্বিনী", "Bharani": "ভরণী", "Krittika": "কৃত্তিকা", "Rohini": "রোহিণী", "Mrigashira": "মৃগশিরা",
  "Ardra": "আর্দ্রা", "Punarvasu": "পুনর্বসু", "Pushya": "পুষ্যা", "Ashlesha": "আশ্লেষা", "Magha": "মঘা",
  "Purva Phalguni": "পূর্বফাল্গুনী", "Uttara Phalguni": "উত্তরফাল্গুনী", "Hasta": "হস্তা", "Chitra": "চিত্রা",
  "Svati": "স্বাতী", "Vishakha": "বিশাখা", "Anuradha": "অনুরাধা", "Jyeshtha": "জ্যেষ্ঠা", "Mula": "মূলা",
  "Purva Ashadha": "পূর্বাষাঢ়া", "Uttara Ashadha": "উত্তরাষাঢ়া", "Shravana": "শ্রবণা", "Dhanishtha": "ধনিষ্ঠা",
  "Shatabhisha": "শতভিষা", "Purva Bhadrapada": "পূর্বভাদ্রপদ", "Uttara Bhadrapada": "উত্তরভাদ্রপদ", "Revati": "রেবতী"
};

const YOGA_BN: Record<string, string> = {
  "Vishkambha": "বিষ্কম্ভ", "Priti": "প্রীতি", "Ayushman": "আয়ুষ্মান", "Saubhagya": "সৌভাগ্য", "Shobhana": "শোভন",
  "Atiganda": "অতিগণ্ড", "Sukarma": "সুকর্মা", "Dhriti": "ধৃতি", "Shula": "শূল", "Ganda": "গণ্ড",
  "Vriddhi": "বৃদ্ধি", "Dhruva": "ধ্রুব", "Vyaghata": "ব্যাঘাত", "Harshana": "হর্ষণ", "Vajra": "বজ্র",
  "Siddhi": "সিদ্ধি", "Vyatipata": "ব্যতীপাত", "Variyana": "বরীয়ান", "Parigha": "পরিঘ", "Shiva": "শিব",
  "Siddha": "সিদ্ধ", "Sadhya": "সাধ্য", "Shubha": "শুভ", "Shukla": "শুক্ল", "Brahma": "ব্রহ্ম",
  "Indra": "ইন্দ্র", "Vaidhriti": "বৈধৃতি"
};

const KARANA_BN: Record<string, string> = {
  "Bava": "বব", "Balava": "বালব", "Kaulava": "কৌলব", "Taitila": "তৈতিল", "Gara": "গর",
  "Vanija": "বণিজ", "Vishti": "বিষ্টি", "Shakuni": "শকুনি", "Chatushpada": "চতুষ্পদ", "Naga": "নাগ", "Kimstughna": "কিংস্তুঘ্ন"
};

export function localizeMayapurPanchangFields(info: AstronomicalDay, language: DisplayLanguage) {
  const isAmavasya = info.tithi.index === 29;
  const isPurnima = info.tithi.index === 14;
  let tithiName: string;
  if (language === "bn") {
    if (isAmavasya) tithiName = "অমাবস্যা";
    else if (isPurnima) tithiName = "পূর্ণিমা";
    else {
      const pakshaBn = info.tithi.paksha === "shukla" ? "শুক্ল" : "কৃষ্ণ";
      tithiName = `${pakshaBn} ${TITHI_NUM_BN[info.tithi.number - 1] ?? info.tithi.name}`;
    }
    return {
      tithiName,
      nakshatra: NAKSHATRA_BN[info.nakshatra] ?? info.nakshatra,
      yoga: YOGA_BN[info.yoga] ?? info.yoga,
      karana: KARANA_BN[info.karana] ?? info.karana
    };
  }
  if (isAmavasya) tithiName = "Amavasya";
  else if (isPurnima) tithiName = "Purnima";
  else {
    const pakshaEn = info.tithi.paksha === "shukla" ? "Shukla" : "Krishna";
    tithiName = `${pakshaEn} ${TITHI_NUM_EN[info.tithi.number - 1] ?? info.tithi.name}`;
  }
  return {
    tithiName,
    nakshatra: info.nakshatra,
    yoga: info.yoga,
    karana: info.karana
  };
}

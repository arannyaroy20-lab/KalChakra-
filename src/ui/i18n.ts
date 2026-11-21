import type { CalendarId } from "../integration/types.js";

export const monthNames = { bn: ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"], en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] };
export const weekdays = { bn: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };

export const copy = {
  bn: { app: "মাল্টিক্যাল", subtitle: "এক জায়গায় চারটি স্বতন্ত্র বর্ষপঞ্জি", system: "ক্যালেন্ডার সিস্টেম", language: "ইন্টারফেস ভাষা", today: "আজ", prev: "আগের দিন", next: "পরের দিন", gregorian: "গ্রেগরিয়ান তারিখ", selected: "নির্বাচিত ক্যালেন্ডারের তারিখ", events: "আজকের অনুষ্ঠান ও ছুটি", noEvents: "এই তারিখে কোনো নথিভুক্ত অনুষ্ঠান পাওয়া যায়নি।", panchang: "পঞ্জিকা ও জ্যোতির্বৈজ্ঞানিক তথ্য", sunrise: "সূর্যোদয়", sunset: "সূর্যাস্ত", tithi: "তিথি", nakshatra: "নক্ষত্র", yoga: "যোগ", karana: "করণ", validation: "বাংলাদেশি বাংলা তারিখ যাচাই", validate: "বাহ্যিক রেফারেন্সে যাচাই করুন", checking: "যাচাই হচ্ছে…", matched: "বাহ্যিক রেফারেন্সের সঙ্গে মিলেছে", mismatch: "তারিখে অমিল পাওয়া গেছে", offline: "বাহ্যিক যাচাই পাওয়া যায়নি", limited: "সীমিত ডেটা", approximate: "আনুমানিক গণনা", verified: "রেফারেন্সে যাচাইকৃত", unavailable: "এই ক্যালেন্ডারে আলাদা বাংলা তারিখ নেই", about: "তথ্যসূত্র ও পরিচিতি", attribution: "বাংলাদেশি বাংলা তারিখের ঐচ্ছিক যাচাই: BanglaDateToday", apiNote: "বাহ্যিক ফলাফল কেবল তুলনার জন্য; MultiCal-এর নিজস্ব গণনা পরিবর্তন করে না।", eventHoliday: "সরকারি ছুটি", source: "তথ্যসূত্র", status: "অবস্থা", chooseDate: "তারিখ নির্বাচন", monthView: "মাসের ক্যালেন্ডার", dayDetails: "দিনের বিবরণ", noPanchang: "এই ক্যালেন্ডারে পঞ্জিকা তথ্য সরবরাহ করা হয় না।", noNative: "এই সিস্টেম Gregorian তারিখে অনুষ্ঠান সংরক্ষণ করে; আলাদা বঙ্গাব্দ তারিখ নির্ধারণ করে না।", mayapurNoNative: "মায়াপুর ইঞ্জিন পঞ্জাঙ্গ ও বৈষ্ণবীয় অনুষ্ঠান দেয়, কিন্তু বর্তমানে গৌরাব্দ বছর/মাস/দিন প্রকাশ করে না." },
  en: { app: "MultiCal", subtitle: "Four independent calendar systems, one place", system: "Calendar system", language: "Interface language", today: "Today", prev: "Previous day", next: "Next day", gregorian: "Gregorian date", selected: "Selected calendar date", events: "Events & holidays", noEvents: "No recorded events for this date.", panchang: "Panchang & astronomical details", sunrise: "Sunrise", sunset: "Sunset", tithi: "Tithi", nakshatra: "Nakshatra", yoga: "Yoga", karana: "Karana", validation: "Bangladesh Bengali date validation", validate: "Validate with external reference", checking: "Checking…", matched: "Matches external reference", mismatch: "Date discrepancy found", offline: "External validation unavailable", limited: "Limited dataset", approximate: "Approximate calculation", verified: "Reference verified", unavailable: "No separate Bengali date in this calendar", about: "Sources & credits", attribution: "Optional Bangladesh Bengali date reference: BanglaDateToday", apiNote: "External results are comparison-only and never overwrite MultiCal's internal calculation.", eventHoliday: "Public holiday", source: "Source", status: "Status", chooseDate: "Choose date", monthView: "Month view", dayDetails: "Day details", noPanchang: "Panchang data is not provided by this calendar.", noNative: "This system stores events against Gregorian dates and does not define a separate Bangla date.", mayapurNoNative: "The Mayapur engine provides Panchang and Vaishnava observances, but does not currently expose a Gaurabda year/month/day." }
};

export const ui = {
  bn: {
    accent: "থিমের রং",
    home: "হোম", calendars: "ক্যালেন্ডার সমূহ", navigate: "নেভিগেশন", collapse: "সাইডবার", panchangShort: "পঞ্জিকা", upcoming: "আসছে", todayEvents: "আজকের অনুষ্ঠান", noToday: "আজ কোনো অনুষ্ঠান নেই", inDays: "দিন পর", tomorrow: "কাল", openCalendar: "ক্যালেন্ডার খুলুন", seeAll: "সব ইঞ্জিন দেখুন", dates: "আজকের তারিখ", gMorning: "শুভ সকাল", gNoon: "শুভ দুপুর", gAfternoon: "শুভ বিকাল", gEvening: "শুভ সন্ধ্যা", gNight: "শুভ রাত্রি", cMorning: "নতুন সকালের সুন্দর সূচনা", cNoon: "শান্ত ও কর্মমুখর দুপুর", cAfternoon: "নরম রোদের সোনালি বিকাল", cEvening: "দিনের শেষে স্নিগ্ধ সন্ধ্যা", cNight: "শান্ত ও নিরিবিলি রাত্রি", nothingUpcoming: "আগামী দিনে কোনো অনুষ্ঠান নেই",
    prevMonth: "আগের মাস", nextMonth: "পরের মাস", theme: "থিম পরিবর্তন", holiday: "ছুটি", todayTag: "আজ", hint: "কিবোর্ডের ← → ↑ ↓ দিয়ে দিন বদলান, PageUp/PageDown দিয়ে মাস।",
    viewCalendar: "ক্যালেন্ডার", viewAll: "সব ইঞ্জিন", viewAgenda: "এজেন্ডা", views: "ভিউ", layers: "স্তর",
    thisMonth: "এই মাসের অনুষ্ঠান", noMonthEvents: "এই মাসে কোনো অনুষ্ঠান নেই।", allTitle: "চারটি ক্যালেন্ডার একসাথে", agendaTitle: "মাসের এজেন্ডা",
    gregorianMonth: "গ্রেগরিয়ান মাস", banglaMonths: "বাংলা মাস", calculating: "হিসাব হচ্ছে…", daysWithEvents: "দিনে অনুষ্ঠান", moreEvents: "আরও",
    holidayGeneral: "সাধারণ ছুটি", holidayExecutive: "নির্বাহী ছুটি", holidayOptional: "ঐচ্ছিক ছুটি", holidayRegional: "আঞ্চলিক ছুটি",
    legendGeneral: "সরকারি ছুটি", legendSoft: "ঐচ্ছিক / আঞ্চলিক", legendVaishnava: "সনাতন / বৈষ্ণব পর্ব", legendSelected: "নির্বাচিত দিন", legendEvents: "অনুষ্ঠান আছে",
    gregorianLabel: "গ্রেগরিয়ান", noEventsShort: "কোনো অনুষ্ঠান নেই", engineDate: "ক্যালেন্ডারের তারিখ", agendaEmpty: "নির্বাচিত স্তরে এই মাসে কোনো অনুষ্ঠান নেই।",
    settings: "সেটিংস", themeMode: "কালার মোড", light: "লাইট", dark: "ডার্ক", close: "বন্ধ করুন",
    hinduMode: "হিন্দু ক্যালেন্ডার মোড", modeSanatan: "সনাতন পঞ্জিকা", modeIskcon: "ইসকন মায়াপুর",
    myAgenda: "আমার এজেন্ডা", yourAgendas: "আপনার এজেন্ডাসমূহ", setAgenda: "এজেন্ডা সেট করুন", noAgendasEmpty: "এখনো কোনো ব্যক্তিগত এজেন্ডা যোগ করা হয়নি।",
    noDayAgendas: "এই তারিখে কোনো এজেন্ডা নেই। নিচের ক্যালেন্ডার থেকে দিন বেছে ডান পাশে তৈরি করুন।",
    filterDay: "নির্বাচিত দিন", filterAll: "সব এজেন্ডা", createAgenda: "নতুন এজেন্ডা তৈরি করুন", editAgenda: "এজেন্ডা সম্পাদনা",
    agendaName: "এজেন্ডার নাম", agendaNamePlaceholder: "যেমন: মায়ের জন্মদিন, ফাইনাল পরীক্ষা…",
    agendaTimeMode: "সময় নির্ধারণ", allDay: "সারা দিন", specificTime: "নির্দিষ্ট সময়",
    agendaReminder: "রিমাইন্ডার", reminderOn: "চালু", reminderOff: "বন্ধ",
    agendaRepeat: "পুনরাবৃত্তি", repeatOnce: "শুধু ১ দিন", repeatWeekly: "প্রতি সপ্তাহে", repeatMonthly: "প্রতি মাসে", repeatYearly: "প্রতি বছরে", repeatWeekdays: "সপ্তাহের নির্দিষ্ট দিন",
    agendaTypePrompt: "এজেন্ডার ধরন বেছে নিন", agendaComment: "কমেন্ট / নোট (ঐচ্ছিক)",
    saveAgenda: "এজেন্ডা সেভ করুন", updateAgenda: "আপডেট করুন", cancelEdit: "বাতিল",
    mainBadge: "মূল", dragPriorityHint: "টেনে উপরে-নিচে করে প্রায়োরিটি সাজান",
    moreTodayAgendas: "আজকের বাকি এজেন্ডা",
    accents: { mint: "মিন্ট", green: "সবুজ", blue: "নীল", clay: "টেরাকোটা", purple: "বেগুনি", red: "লাল" }
  },
  en: {
    accent: "Theme colour",
    home: "Home", calendars: "Calendars", navigate: "Navigate", collapse: "Sidebar", panchangShort: "Panchang", upcoming: "Coming up", todayEvents: "Today's events", noToday: "Nothing scheduled today", inDays: "days", tomorrow: "Tomorrow", openCalendar: "Open calendar", seeAll: "See all engines", dates: "Today's dates", gMorning: "Good morning", gNoon: "Good afternoon", gAfternoon: "Good afternoon", gEvening: "Good evening", gNight: "Good night", cMorning: "A fresh start to your day", cNoon: "Steady focus for the midday", cAfternoon: "Warm light as the day eases", cEvening: "A calm and quiet evening", cNight: "Wishing you a peaceful night", nothingUpcoming: "Nothing coming up",
    prevMonth: "Previous month", nextMonth: "Next month", theme: "Toggle theme", holiday: "Holiday", todayTag: "Today", hint: "Use ← → ↑ ↓ to move between days, PageUp/PageDown for months.",
    viewCalendar: "Calendar", viewAll: "All engines", viewAgenda: "Agenda", views: "View", layers: "Layers",
    thisMonth: "This month", noMonthEvents: "No events this month.", allTitle: "All four calendars together", agendaTitle: "Month agenda",
    gregorianMonth: "Gregorian month", banglaMonths: "Bangla months", calculating: "Calculating…", daysWithEvents: "days with events", moreEvents: "more",
    holidayGeneral: "General holiday", holidayExecutive: "Executive holiday", holidayOptional: "Optional holiday", holidayRegional: "Regional holiday",
    legendGeneral: "Public holiday", legendSoft: "Optional / regional", legendVaishnava: "Sanatan / Vaishnava", legendSelected: "Selected day", legendEvents: "Has events",
    gregorianLabel: "Gregorian", noEventsShort: "No events", engineDate: "Calendar date", agendaEmpty: "No events this month in the selected layers.",
    settings: "Settings", themeMode: "Appearance", light: "Light", dark: "Dark", close: "Close",
    hinduMode: "Hindu calendar mode", modeSanatan: "Sanatan", modeIskcon: "ISKCON Mayapur",
    myAgenda: "My Agenda", yourAgendas: "Your Agendas", setAgenda: "Set Agenda", noAgendasEmpty: "No personal agendas saved yet.",
    noDayAgendas: "No agendas for this date. Pick any day on the calendar and create one on the right.",
    filterDay: "Selected day", filterAll: "All agendas", createAgenda: "Create Agenda", editAgenda: "Edit Agenda",
    agendaName: "Agenda title", agendaNamePlaceholder: "e.g. Mom's birthday, Final exam…",
    agendaTimeMode: "Time", allDay: "All day", specificTime: "Specific time",
    agendaReminder: "Reminder", reminderOn: "On", reminderOff: "Off",
    agendaRepeat: "Repeat", repeatOnce: "Once", repeatWeekly: "Weekly", repeatMonthly: "Monthly", repeatYearly: "Yearly", repeatWeekdays: "Specific days",
    agendaTypePrompt: "What's your agenda?", agendaComment: "Comment / note (optional)",
    saveAgenda: "Save Agenda", updateAgenda: "Update Agenda", cancelEdit: "Cancel",
    mainBadge: "Main", dragPriorityHint: "Drag items to set priority order",
    moreTodayAgendas: "More agendas today",
    accents: { mint: "Mint", green: "Forest", blue: "Blue", clay: "Clay", purple: "Purple", red: "Red" }
  }
};

export interface EngineMeta { id: CalendarId; short: { bn: string; en: string } }
export const ENGINES: readonly EngineMeta[] = [
  { id: "bd-national", short: { bn: "জাতীয়", en: "National" } },
  { id: "bd-bengali", short: { bn: "বাংলাদেশ বাংলা", en: "BD Bangla" } },
  { id: "india-bengali", short: { bn: "পশ্চিমবঙ্গ", en: "West Bengal" } },
  { id: "iskcon-mayapur", short: { bn: "ইসকন মায়াপুর", en: "ISKCON" } }
];

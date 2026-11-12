# MultiCal — Product Requirements Document (PRD)

**Project Name:** MultiCal  
**Document Type:** Product Requirements Document  
**Version:** 1.0  
**Status:** Initial Product Specification  
**Platform:** Desktop Application  
**Primary Languages:** Bengali (বাংলা), English  
**Target Operating Systems:** Windows initially, Linux and macOS as future targets.

---

# 1. Project Overview

## 1.1 Introduction

MultiCal is a multilingual desktop calendar application designed to integrate four independent calendar systems into a single unified Gregorian timeline.

The application will provide users with access to:

1. Bangladesh National Calendar.
2. Bangladesh Bengali Calendar.
3. India Bengali Calendar (West Bengal Panjika).
4. ISKCON Mayapur Calendar.

Although all four calendar systems will appear inside one application, their calculation rules, date systems, regional conventions and original data sources must remain independent.

MultiCal will provide a unified interface and event management layer without merging the underlying calendar logic.

## 1.2 Vision

To build a reliable, multilingual calendar application that allows users to explore different regional, cultural, national and religious calendar systems through one consistent desktop experience.

## 1.3 Core Objectives

- Integrate four independent calendar engines.
- Display all calendar events on a unified Gregorian timeline.
- Support Bengali and English interfaces.
- Provide accurate Gregorian and Bengali date conversion.
- Preserve original calendar dates and source information.
- Distinguish official holidays from ordinary observances.
- Provide reliable religious calendar information.
- Support yearly event data updates.
- Prevent accidental duplicate records.
- Maintain a modular architecture that supports future expansion.

## 1.4 Core Architectural Principle

**Four independent calendar engines, one unified event management system.**

Each calendar engine is responsible for its own date calculations, regional rules and event interpretation.

The Unified Event Manager is responsible for displaying and organizing events from all four engines.

No calendar engine may modify or override another engine's rules.

---

# 2. Target Users and Use Cases

## 2.1 Target Users

### A. General Users
People who want to view national holidays, Bengali dates, festivals and important observances.

### B. Bengali Calendar Users
Users who regularly follow Bengali dates, months, seasons and traditional calendar information.

### C. Religious Users
Users interested in ISKCON observances, Ekadashi, fasting schedules, Parana and Vaishnava festivals.

### D. Researchers and Students
Users who need historical dates, cultural events and reliable calendar references.

### E. International Users
Users who want to explore Bengali and Indian calendar systems through an English interface.

## 2.2 Primary Use Cases

| ID | Use Case |
|---|---|
| UC-01 | View today's Gregorian date and corresponding Bengali dates. |
| UC-02 | Switch between the four calendar systems. |
| UC-03 | View all four calendars together on one timeline. |
| UC-04 | Search for festivals and observances. |
| UC-05 | Filter events by calendar and category. |
| UC-06 | Convert Gregorian dates to Bangladesh Bengali dates. |
| UC-07 | Convert Bangladesh Bengali dates to Gregorian dates. |
| UC-08 | View detailed Panjika information. |
| UC-09 | View ISKCON fasting and Parana information. |
| UC-10 | Identify official Bangladesh public holidays. |
| UC-11 | View historical and cultural observances. |
| UC-12 | Update calendar event datasets for a new year. |

---

# 3. Detailed Calendar Engine Requirements

Each calendar engine must operate independently.

## 3.1 Engine 1: Bangladesh National Calendar

### Purpose

Provide official Bangladesh holidays, national observances and other relevant national and international events.

### 3.1.1 Event Categories

The engine must support:

**A. Official Public Holidays**
- Government-declared public holidays.
- National holidays.
- Religious holidays officially declared by the government.

**B. National Days**
- Independence Day.
- Victory Day.
- Language Martyrs' Day.
- National Mourning Day, where applicable according to current official policy.
- Other nationally recognized days.

**C. Religious Observances**
- Eid-related observances.
- Durga Puja.
- Buddha Purnima.
- Christmas.
- Other recognized religious events.

**D. Cultural Events**
- Pohela Boishakh.
- Traditional cultural celebrations.
- Regional cultural observances.

**E. Historical Events**
- Important historical anniversaries.
- Liberation War-related dates.
- Significant national historical events.

**F. International Observances**
- International Mother Language Day.
- International Women's Day.
- World Environment Day.
- Other relevant international observances.

### 3.1.2 Holiday Classification

Every event must have an explicit classification.

Possible values:

- `PUBLIC_HOLIDAY`
- `NATIONAL_DAY`
- `RELIGIOUS_OBSERVANCE`
- `CULTURAL_EVENT`
- `HISTORICAL_EVENT`
- `INTERNATIONAL_OBSERVANCE`

Official public holidays must be visually distinguishable from ordinary observances.

An ordinary observance must never automatically be classified as a government holiday.

### 3.1.3 Data Requirements

Each event should include:

- Event name in Bengali.
- Event name in English.
- Gregorian date.
- Event category.
- Official holiday status.
- Description.
- Source organization.
- Source URL.
- Publication date.
- Verification status.
- Applicable year.
- Recurrence information, if applicable.

### 3.1.4 Date Handling

Government-declared holidays may change from year to year.

Therefore:

- Do not assume every holiday has a permanent Gregorian date.
- Do not calculate variable religious holidays using fixed Gregorian recurrence.
- Preserve government-announced dates.
- Support year-specific holiday records.
- Allow replacement or correction through a verified dataset update.

---

## 3.2 Engine 2: Bangladesh Bengali Calendar

### Purpose

Implement the revised official Bangladesh Bengali calendar system.

This engine must follow Bangladesh's revised calendar rules rather than traditional West Bengal Panjika calculations.

### 3.2.1 Calendar Structure

The engine must support all 12 Bengali months:

| Bengali Month | English Transliteration |
|---|---|
| বৈশাখ | Boishakh |
| জ্যৈষ্ঠ | Joishtho |
| আষাঢ় | Asharh |
| শ্রাবণ | Srabon |
| ভাদ্র | Bhadro |
| আশ্বিন | Ashwin |
| কার্তিক | Kartik |
| অগ্রহায়ণ | Ogrohayon |
| পৌষ | Poush |
| মাঘ | Magh |
| ফাল্গুন | Falgun |
| চৈত্র | Choitro |

### 3.2.2 Required Features

- Display Bengali year.
- Display Bengali month.
- Display Bengali day.
- Display Bengali weekdays.
- Display Bengali seasons.
- Convert Gregorian dates into Bengali dates.
- Convert Bengali dates into Gregorian dates.
- Handle month boundaries correctly.
- Handle leap years correctly.

### 3.2.3 Month and Year Rules

The implementation must use the official revised Bangladesh Bengali calendar specification.

The system must not assume that traditional West Bengal month-length rules apply.

The engine must maintain a clearly defined rule set for:

- Month starting dates.
- Month lengths.
- Year boundaries.
- Leap-year treatment.
- Falgun adjustment.
- Gregorian year transitions.

The exact leap-year algorithm and its applicable historical or current validity must be verified against authoritative Bangladesh calendar references before implementation.

### 3.2.4 Date Conversion

Two conversion operations are required:

**Gregorian to Bengali**

Input:
- Gregorian year.
- Gregorian month.
- Gregorian day.

Output:
- Bengali year.
- Bengali month.
- Bengali day.
- Bengali season.

**Bengali to Gregorian**

Input:
- Bengali year.
- Bengali month.
- Bengali day.

Output:
- Gregorian year.
- Gregorian month.
- Gregorian day.

Invalid Bengali dates must return a validation error rather than silently producing an incorrect date.

### 3.2.5 Seasons

Support six Bengali seasons:

- গ্রীষ্ম — Summer
- বর্ষা — Monsoon
- শরৎ — Autumn
- হেমন্ত — Late Autumn
- শীত — Winter
- বসন্ত — Spring

Season assignments must follow the Bangladesh calendar's defined month structure.

### 3.2.6 Calculation Requirements

The engine must:

- Use deterministic date calculations.
- Avoid dependency on external APIs during ordinary date conversion.
- Handle Gregorian leap years.
- Handle Bengali year transitions.
- Support dates around December, January and February boundaries.
- Be independently testable.

### 3.2.7 Historical Compatibility

The application should maintain a clear distinction between:

- Current revised Bangladesh calendar rules.
- Historical calendar rules, if historical conversion is later supported.

Do not silently apply current rules to historical dates when their validity is not established.

---

## 3.3 Engine 3: India Bengali Calendar (West Bengal Panjika)

### Purpose

Provide traditional West Bengal Bengali calendar information based on one explicitly selected Panjika tradition.

This engine must remain independent of the revised Bangladesh Bengali calendar.

### 3.3.1 Panjika Selection

The application must select and document one primary Panjika source or tradition.

The selection must be based on:

- Reliability.
- Publication consistency.
- Availability of yearly data.
- Availability of astronomical information.
- Regional relevance.
- Source accessibility.

Different Panjika traditions must not be silently mixed.

If multiple traditions are supported in the future, each must have a separate profile.

### 3.3.2 Required Calendar Information

The engine should support the following information wherever reliable source data is available:

**Basic Calendar Data**
- Bengali year.
- Bengali month.
- Bengali date.
- Weekday.

**Lunar Information**
- Tithi.
- Paksha.
- Purnima.
- Amavasya.

**Panchang Information**
- Nakshatra.
- Yoga.
- Karana.

**Solar Information**
- Sunrise.
- Sunset.

**Religious and Cultural Events**
- Durga Puja.
- Kali Puja.
- Saraswati Puja.
- Lakshmi Puja.
- Dol Purnima.
- Other regional festivals.

### 3.3.3 Tithi Handling

A Tithi may begin or end during a Gregorian day.

Therefore, the engine must support:

- Tithi start time.
- Tithi end time.
- Tithi applicable at sunrise.
- Tithi transitions.
- Tithi spanning multiple civil dates.
- Special festival-date selection rules.

A Tithi must not be represented only as a simple Gregorian date without its applicable timing context.

### 3.3.4 Timezone Requirements

Use the selected Panjika's applicable regional timezone.

For West Bengal, the default civil timezone is `Asia/Kolkata`.

Store original published timings and their timezone context.

Do not assume that every published timing can be converted without knowing its original reference timezone.

### 3.3.5 Festival Rules

Festival dates must follow the selected Panjika's applicable rules.

When different traditions produce different festival dates:

- Use the selected primary tradition.
- Preserve the source information.
- Do not merge conflicting dates into one event.
- Provide a clear distinction if alternative traditions are supported later.

### 3.3.6 Data Availability

Not every Panjika source provides every astronomical field.

The application must support partially populated daily records.

Missing values must be displayed as unavailable, not calculated using invented or unverified assumptions.

---

## 3.4 Engine 4: ISKCON Mayapur Calendar

### Purpose

Provide ISKCON Mayapur-specific religious observances and Vaishnava calendar information.

The engine must follow official Mayapur calendar publications and their associated religious rules.

### 3.4.1 Core Observances

Support:

- Ekadashi.
- Mahadvadashi.
- Dvadashi.
- Parana.
- Fasting days.
- Festival days.
- Acharya appearance days.
- Acharya disappearance days.
- Kartik month observances.
- Damodar month observances.
- Other official Vaishnava observances.

### 3.4.2 Ekadashi and Mahadvadashi

The engine must preserve:

- Observance name.
- Gregorian observance date.
- Original Mayapur calendar date.
- Fasting classification.
- Applicable fasting instructions.
- Associated Dvadashi information.
- Source reference.

Ekadashi and Mahadvadashi must be distinct classifications.

Do not assume that every lunar Ekadashi corresponds directly to an ISKCON fasting day.

### 3.4.3 Parana Requirements

Parana information must support:

- Parana date.
- Parana start time.
- Parana end time.
- Applicable timezone.
- Parana instructions.
- Original source information.

Parana timing must not be calculated using generic local sunrise rules unless the official Mayapur methodology explicitly permits it.

### 3.4.4 Fasting Rules

Support relevant fasting classifications and instructions.

Examples may include:

- Ekadashi fasting.
- Nirjala observance.
- Special festival-related fasting.
- Other official fasting instructions.

The application must distinguish fasting type from the event category.

### 3.4.5 Acharya Observances

Maintain records for:

- Appearance days.
- Disappearance days.
- Associated names.
- Original calendar dates.
- Gregorian dates.
- Descriptions.
- Source references.

### 3.4.6 Kartik and Damodar

Provide dedicated information for:

- Kartik month.
- Damodar observances.
- Daily or period-specific observances where published.
- Associated festival dates.
- Original Mayapur calendar references.

### 3.4.7 Timezone Requirements

Preserve the original Mayapur timezone.

Use `Asia/Kolkata` for Mayapur civil time unless the official source specifies a different time basis.

Every time-dependent record must retain its timezone.

Never silently reinterpret a published Mayapur Parana time as Bangladesh local time.

### 3.4.8 Source Requirements

The engine should prioritize:

1. Official ISKCON Mayapur calendar publications.
2. Official Mayapur announcements.
3. Other explicitly approved ISKCON sources.

External Vaishnava calendars must not override the official Mayapur dataset.

---

# 4. Unified Event Manager

## 4.1 Purpose

The Unified Event Manager is the central event aggregation and presentation layer.

It combines events from all four calendar engines without merging their underlying calculation rules.

## 4.2 Core Responsibilities

- Collect event records from individual engines.
- Normalize event information.
- Associate events with Gregorian dates.
- Preserve original calendar dates.
- Display multiple events on the same day.
- Support event searching.
- Support category filtering.
- Support calendar filtering.
- Prevent accidental duplicate records.
- Preserve source information.

## 4.3 Unified Event Structure

Every event must contain the following conceptual fields:

| Field | Description |
|---|---|
| id | Unique event identifier |
| calendar_id | Source calendar engine |
| title_bn | Bengali title |
| title_en | English title |
| description_bn | Bengali description |
| description_en | English description |
| gregorian_date | Unified Gregorian date |
| original_date | Original calendar date |
| original_calendar | Original date system |
| category_id | Event category |
| event_status | Event classification |
| timezone | Applicable timezone |
| source_id | Associated source |
| verification_status | Verification state |
| year | Applicable Gregorian year |

Additional optional fields should support:

- Start time.
- End time.
- Tithi.
- Paksha.
- Nakshatra.
- Yoga.
- Karana.
- Fasting instructions.
- Parana information.
- Recurrence rules.
- Historical references.

Calendar-specific data must not be forced into irrelevant fields.

Use optional structured metadata or engine-specific detail records.

## 4.4 Unified Timeline

The application must display all four calendar systems on a shared Gregorian timeline.

Example:

**15 April 2027**

- Bangladesh National Calendar: National or cultural observance.
- Bangladesh Bengali Calendar: 2 Boishakh.
- India Bengali Calendar: Traditional Panjika date and applicable Tithi.
- ISKCON Mayapur: Relevant Vaishnava observance, if any.

All entries must retain their original calendar identity.

## 4.5 Filtering

Users must be able to filter by:

**Calendar**
- Bangladesh National.
- Bangladesh Bengali.
- India Bengali.
- ISKCON Mayapur.

**Category**
- Public holiday.
- National day.
- Religious event.
- Cultural event.
- Historical event.
- Festival.
- Fasting.
- Astronomical information.
- International observance.

**Verification**
- Verified.
- Pending verification.
- Corrected.
- Deprecated or superseded.

## 4.6 Search

Search must support:

- Bengali event names.
- English event names.
- Partial matching.
- Calendar-specific search.
- Category-specific search.
- Year-specific search.

Search results should show the event date, calendar identity and category.

## 4.7 Duplicate Prevention

Duplicate prevention must not remove genuinely different observances.

The system must distinguish:

- Same event imported twice.
- Same event published by multiple sources.
- Same festival observed under different traditions.
- Different events sharing the same Gregorian date.
- Different events with similar names.

Recommended duplicate detection should consider:

- Calendar identity.
- Event identity.
- Original date.
- Gregorian date.
- Event category.
- Source.
- Regional or tradition identity.

Use a duplicate review mechanism for uncertain matches.

Never delete an event solely because its title and Gregorian date match another record.

---

# 5. UI/UX Requirements

## 5.1 Design Goals

The interface should be:

- Clean.
- Modern.
- Easy to navigate.
- Responsive within desktop window dimensions.
- Comfortable for Bengali and English users.
- Suitable for daily use.

## 5.2 Main Application Layout

The main window should contain:

**A. Sidebar**
- Home.
- Calendar.
- All Events.
- Bangladesh National.
- Bangladesh Bengali.
- India Bengali.
- ISKCON Mayapur.
- Date Converter.
- Settings.
- About.

**B. Main Content Area**

Displays the selected calendar, timeline, monthly calendar or event details.

**C. Top Navigation**

Contains:

- Current date.
- Calendar navigation.
- Search.
- Language selection.
- View selection.

## 5.3 Calendar Views

Support the following views:

1. Monthly view.
2. Weekly view.
3. Daily view.
4. Yearly overview.
5. Unified timeline.

The initial MVP should prioritize monthly and daily views.

## 5.4 Calendar Selection

Users must be able to:

- Select one calendar.
- Select multiple calendars.
- View all four together.
- Hide individual calendars without disabling their engines.

Calendar selection and interface language must work independently.

## 5.5 Visual Identification

Each calendar should have a consistent visual identity.

The interface should distinguish:

- Calendar origin.
- Event category.
- Public holiday status.
- Fasting observances.
- Verified and unverified data.

Color must not be the only means of identifying an event.

Use text labels or icons alongside color indicators.

## 5.6 Event Details Panel

Clicking an event should open a detailed view containing:

- Event title.
- Bengali and English names.
- Gregorian date.
- Original calendar date.
- Calendar origin.
- Category.
- Description.
- Relevant timings.
- Source information.
- Verification status.

## 5.7 Date Converter

Provide a dedicated conversion interface.

Users should be able to select:

- Gregorian to Bangladesh Bengali.
- Bangladesh Bengali to Gregorian.

The conversion result should be immediately visible.

The selected calendar system must be clearly identified.

## 5.8 Settings

Settings should include:

- Interface language.
- Default calendar selection.
- Default calendar view.
- First day of the week.
- Date display preferences.
- Application startup preferences.
- Data update preferences.

---

# 6. Database and Data Management Requirements

## 6.1 Database Technology

Use SQLite as the primary local database.

Reasons:

- Lightweight.
- Suitable for desktop applications.
- No separate database server required.
- Supports relational data.
- Reliable for offline usage.
- Easy to package with Electron.

## 6.2 Database Design Principles

The database must:

- Preserve source information.
- Preserve original calendar dates.
- Separate calendar definitions from events.
- Separate event categories from event records.
- Support yearly updates.
- Prevent accidental duplication.
- Support future migrations.

## 6.3 Proposed Database Entities

### A. calendars

Stores calendar engine definitions.

Fields:

- id
- name
- name_bn
- name_en
- description
- timezone
- calendar_type
- enabled

Example IDs:

- `bd_national`
- `bd_bengali`
- `india_bengali`
- `iskcon_mayapur`

### B. events

Stores unified event information.

Fields:

- id
- calendar_id
- title_bn
- title_en
- description_bn
- description_en
- gregorian_date
- original_date
- category_id
- event_status
- source_id
- verification_status
- created_at
- updated_at

### C. event_categories

Stores event classifications.

Fields:

- id
- name
- name_bn
- name_en
- description

### D. sources

Stores source information.

Fields:

- id
- source_name
- organization
- source_url
- source_type
- publication_date
- accessed_at
- reliability_notes

### E. event_sources

Associates events with one or more sources.

Fields:

- id
- event_id
- source_id
- source_reference
- verification_status

This supports multiple sources for one event without duplicating the event itself.

### F. calendar_rules

Stores calendar calculation rule versions.

Fields:

- id
- calendar_id
- rule_version
- effective_from
- effective_until
- description
- source_id

### G. event_metadata

Stores optional calendar-specific information.

Fields:

- id
- event_id
- metadata_key
- metadata_value

For complex structured information, dedicated detail tables should be preferred over storing everything as unstructured text.

### H. yearly_datasets

Tracks yearly data releases.

Fields:

- id
- calendar_id
- year
- dataset_version
- release_date
- verification_status
- source_id
- imported_at

### I. update_history

Tracks data update operations.

Fields:

- id
- dataset_id
- update_type
- previous_version
- new_version
- operation_status
- updated_at
- notes

## 6.4 Database Integrity

Required constraints:

- Every event must reference an existing calendar.
- Every category reference must be valid.
- Every source reference must be valid.
- Event IDs must be unique.
- Dates must use a consistent canonical representation.
- Database updates must use transactions.
- Invalid updates must be rolled back.

## 6.5 Data Versioning

Calendar calculation rules and yearly event datasets must be versioned independently.

For example:

- Bangladesh Bengali calculation rules: version 1.0.
- Bangladesh National 2027 dataset: version 1.0.
- ISKCON Mayapur 2027 dataset: version 1.0.

Updating a yearly event dataset must not silently change a calendar's date calculation rules.

---

# 7. Localization Requirements

## 7.1 Supported Languages

Initial languages:

- Bengali (`bn`)
- English (`en`)

## 7.2 Localization Technology

Use i18next with React integration.

## 7.3 Requirements

All interface text must be externalized into translation files.

Suggested structure:

- `locales/bn/translation.json`
- `locales/en/translation.json`

Do not hardcode interface text directly inside components.

## 7.4 Independent Language and Calendar Selection

This is a critical requirement.

The selected calendar and interface language must be independent.

Examples:

- Bengali interface + ISKCON Mayapur calendar.
- English interface + Bangladesh Bengali calendar.
- Bengali interface + all four calendars.
- English interface + India Bengali calendar.

Changing the interface language must not change the selected calendar or its underlying rules.

## 7.5 Date Formatting

Support:

- Bengali numerals.
- English numerals.
- Bengali month names.
- English month names.
- Localized weekdays.
- Localized event names.

## 7.6 Localization Fallback

If a translation is unavailable:

- Display the available language.
- Do not hide the event.
- Preserve the original title.
- Avoid displaying empty or broken text.

---

# 8. Data Sources and Verification Requirements

## 8.1 General Principles

MultiCal must prioritize accuracy over the quantity of available events.

No event date should be invented.

Every externally sourced event must retain its source information.

## 8.2 Source Priorities

### Bangladesh National Calendar

Priority sources:

1. Government of Bangladesh.
2. Official government gazette.
3. Relevant ministries and government departments.
4. Recognized official institutional publications.

### Bangladesh Bengali Calendar

Priority sources:

1. Official Bangladesh calendar publications.
2. Authoritative references describing the revised calendar.
3. Verified calendar rule documentation.

### India Bengali Calendar

Priority sources:

1. The selected West Bengal Panjika publisher.
2. Official publisher publications.
3. Reliable astronomical references used to verify calculations.

### ISKCON Mayapur

Priority sources:

1. Official ISKCON Mayapur publications.
2. Official Mayapur calendar.
3. Official ISKCON announcements.

## 8.3 Verification Status

Every imported event must have a verification state.

Supported values:

- `VERIFIED`
- `PENDING`
- `CORRECTED`
- `SUPERSEDED`
- `REJECTED`

## 8.4 Verification Workflow

Recommended process:

1. Identify an authoritative source.
2. Extract the published event information.
3. Record the publication date.
4. Record the source URL.
5. Compare the date with other reliable references when necessary.
6. Review calendar-specific rules.
7. Mark the record as verified or pending.
8. Import the approved dataset.

## 8.5 Source Preservation

Do not discard the original source information after importing an event.

Preserve:

- Source name.
- Organization.
- Original URL.
- Publication date.
- Retrieval date.
- Relevant source reference.
- Verification notes.

## 8.6 Yearly Updates

The system must support new yearly datasets without requiring changes to the application code.

The update workflow should:

- Import a new dataset.
- Validate its structure.
- Check calendar identity.
- Check duplicate records.
- Check date validity.
- Verify source information.
- Apply updates transactionally.
- Maintain an update history.

---

# 9. Technical Architecture Requirements

## 9.1 Recommended Technology Stack

| Layer | Technology |
|---|---|
| Desktop Framework | Electron |
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Database | SQLite |
| Localization | i18next |
| State Management | React state initially; introduce a dedicated solution only when needed |
| Testing | Vitest |
| UI Testing | React Testing Library |
| Desktop Testing | Playwright Electron or equivalent supported tooling |

## 9.2 Architectural Structure

The application should use a modular architecture.

Conceptual structure:

```text
MultiCal
│
├── Desktop Application
│   └── Electron
│
├── Presentation Layer
│   ├── React
│   ├── Components
│   ├── Pages
│   └── Localization
│
├── Application Layer
│   ├── Calendar Selection
│   ├── Unified Event Manager
│   ├── Search
│   ├── Filtering
│   └── Data Updates
│
├── Calendar Engines
│   ├── Bangladesh National
│   ├── Bangladesh Bengali
│   ├── India Bengali
│   └── ISKCON Mayapur
│
├── Data Layer
│   ├── SQLite
│   ├── Repositories
│   ├── Dataset Import
│   └── Database Migrations
│
└── Shared Utilities
    ├── Date Formatting
    ├── Validation
    ├── Timezone Handling
    └── Source Verification
```

## 9.3 Calendar Engine Interface

Each engine should expose a common application-facing interface while maintaining independent internal implementation.

Conceptual operations:

- Get calendar information.
- Convert dates where applicable.
- Retrieve events for a date range.
- Retrieve calendar-specific daily information.
- Validate calendar dates.
- Identify supported date ranges.

A common interface must not imply common calculation rules.

The Bangladesh Bengali engine and India Bengali engine must never share an assumed month-length or leap-year algorithm.

## 9.4 Electron Security

The desktop application must:

- Enable context isolation.
- Disable Node.js integration in the renderer.
- Use a secure preload bridge.
- Expose only required IPC operations.
- Validate IPC input.
- Avoid arbitrary filesystem access from the renderer.
- Avoid executing untrusted remote content.

## 9.5 Offline Support

Core calendar functionality must work offline.

This includes:

- Calendar navigation.
- Date conversion.
- Searching locally stored events.
- Filtering.
- Viewing imported yearly datasets.

Internet access may be required for future dataset updates, but it must not be necessary for ordinary application usage.

---

# 10. Non-Functional Requirements

## 10.1 Performance

- Application startup should be reasonably fast.
- Calendar navigation should feel responsive.
- Event search should use database indexing where appropriate.
- Date conversion should be computationally lightweight.
- Large event collections must not freeze the interface.

## 10.2 Reliability

- No silent data corruption.
- Transactional database updates.
- Validated calendar calculations.
- Consistent event identity.
- Recoverable application errors.

## 10.3 Maintainability

- Independent calendar modules.
- Reusable UI components.
- Strong TypeScript typing.
- Documented calculation rules.
- Clear separation between UI and data.
- Versioned datasets.

## 10.4 Scalability

The architecture should support:

- Additional regional calendars.
- More interface languages.
- Additional event categories.
- Larger yearly datasets.
- Alternative Panjika profiles.
- Future calendar export functionality.

## 10.5 Accessibility

- Keyboard navigation.
- Readable typography.
- Appropriate color contrast.
- Clear event labels.
- Tooltips where necessary.
- Avoid color-only information indicators.

---

# 11. Error Handling and Edge Cases

The application must handle the following situations.

## 11.1 Date Conversion Errors

- Invalid Gregorian dates.
- Invalid Bengali dates.
- Unsupported historical dates.
- Leap-year boundary errors.
- Month transition errors.

## 11.2 Calendar Data Errors

- Missing yearly dataset.
- Incomplete event information.
- Invalid source URL.
- Conflicting published dates.
- Duplicate imported records.
- Unsupported calendar rules.

## 11.3 Timezone Errors

- Incorrect timezone conversion.
- Day-boundary changes.
- Tithi transitions.
- Sunrise and sunset date differences.
- Parana times crossing civil date boundaries.

## 11.4 Database Errors

- Database unavailable.
- Database migration failure.
- Corrupted dataset.
- Failed transaction.
- Duplicate primary keys.
- Missing foreign-key references.

## 11.5 Localization Errors

- Missing translations.
- Incorrect Bengali numeral formatting.
- Incorrect date formatting.
- Unicode rendering problems.

## 11.6 Expected Behavior

Errors must be:

- Clearly reported.
- Logged where appropriate.
- Recoverable when possible.
- Prevented from silently generating incorrect dates or event information.

If a dataset is unavailable, the application should display an appropriate unavailable-data message rather than fabricated information.

---

# 12. Testing Requirements

Testing must cover each independent calendar engine and the shared application layer.

## 12.1 Unit Testing

### Bangladesh National Engine

Test:

- Event classification.
- Holiday status.
- Year-specific event records.
- Date validity.
- Recurring and non-recurring events.

### Bangladesh Bengali Engine

Test:

- All 12 month boundaries.
- Gregorian-to-Bengali conversion.
- Bengali-to-Gregorian conversion.
- Leap years.
- Year transitions.
- Season assignments.
- Known reference dates.

### India Bengali Engine

Test:

- Selected Panjika data integrity.
- Bengali date records.
- Tithi transitions.
- Nakshatra records.
- Sunrise and sunset values.
- Festival dates.
- Timezone handling.

### ISKCON Mayapur Engine

Test:

- Ekadashi classification.
- Mahadvadashi classification.
- Parana dates and timings.
- Fasting classifications.
- Acharya observances.
- Kartik and Damodar records.
- Mayapur timezone handling.

## 12.2 Integration Testing

Test:

- All four engines connecting to the Unified Event Manager.
- Events appearing on the correct Gregorian date.
- Calendar filtering.
- Category filtering.
- Event searching.
- Source preservation.
- Duplicate detection.
- Yearly dataset import.

## 12.3 UI Testing

Test:

- Calendar navigation.
- Monthly view.
- Daily view.
- Event detail panel.
- Calendar selection.
- Language switching.
- Date conversion.
- Search and filtering.

## 12.4 Regression Testing

Every change to a calendar calculation engine must run the existing reference-date test suite.

Previously verified dates must not change unexpectedly.

Any intentional rule change must include:

- Rule version update.
- Explanation.
- Updated reference tests.
- Documentation.

## 12.5 Acceptance Testing

A feature is accepted only when:

- Its requirements are implemented.
- Relevant tests pass.
- Its data sources are documented.
- Its behavior is verified.
- Documentation is updated.

---

# 13. Future Expansion Possibilities

The following features are outside the initial MVP but should remain architecturally possible.

## 13.1 Calendar Features

- Additional Indian regional calendars.
- Additional Bengali Panjika traditions.
- Historical calendar support.
- Islamic Hijri calendar.
- Gregorian and Julian historical conversion.
- Advanced astronomical calculations.

## 13.2 User Features

- Personal events.
- Custom reminders.
- Event notifications.
- Favorite events.
- Custom categories.
- Notes.
- Export to PDF.
- Calendar printing.
- ICS export.
- Desktop notifications.

## 13.3 Data Features

- Automated yearly data updates.
- Source comparison tools.
- Data correction interface.
- Dataset import/export.
- Calendar synchronization.
- Historical event archives.

## 13.4 Platform Expansion

- Linux support.
- macOS support.
- Mobile companion application.
- Cloud synchronization.
- Optional web version.

These features must not compromise the independence of the four original calendar engines.

---

# 14. MVP Scope and Development Priorities

The initial release must prioritize correctness, stability and maintainability over feature quantity.

## 14.1 MVP Phase 1: Application Foundation

Deliverables:

- Electron application setup.
- React and TypeScript integration.
- Vite configuration.
- Tailwind CSS.
- SQLite integration.
- Basic application layout.
- Bengali and English localization.
- Initial database schema.

Acceptance criteria:

- Desktop application launches successfully.
- Both languages work.
- Database initializes correctly.
- Application architecture is modular.

## 14.2 MVP Phase 2: Bangladesh Bengali Calendar

Deliverables:

- Revised Bangladesh calendar rules.
- All 12 Bengali months.
- Bengali date calculation.
- Gregorian-to-Bengali conversion.
- Bengali-to-Gregorian conversion.
- Season calculation.
- Leap-year handling.

Acceptance criteria:

- Reference dates match authoritative calendar data.
- All month boundaries pass tests.
- Leap-year behavior is verified.
- Both conversion directions work correctly.

## 14.3 MVP Phase 3: Bangladesh National Calendar

Deliverables:

- National event dataset.
- Public holiday classification.
- National days.
- Religious and cultural observances.
- Event source tracking.
- Year-specific data support.

Acceptance criteria:

- Official public holidays are distinguishable.
- Every imported event has a source.
- Yearly datasets can be imported without modifying application code.

## 14.4 MVP Phase 4: India Bengali Calendar

Deliverables:

- Selected West Bengal Panjika profile.
- Bengali date information.
- Tithi.
- Paksha.
- Nakshatra.
- Yoga.
- Karana.
- Sunrise and sunset.
- Major regional festivals.

Acceptance criteria:

- One clearly documented Panjika tradition is followed.
- Original published data is preserved.
- No conflicting traditions are silently mixed.
- Missing information is handled correctly.

## 14.5 MVP Phase 5: ISKCON Mayapur Calendar

Deliverables:

- Official Mayapur yearly dataset.
- Ekadashi.
- Mahadvadashi.
- Parana.
- Fasting information.
- Acharya appearance and disappearance days.
- Kartik and Damodar observances.

Acceptance criteria:

- Official Mayapur dates are preserved.
- Original timezone information is retained.
- Fasting and Parana information is distinguishable.
- Source references are available.

## 14.6 MVP Phase 6: Unified Event Manager

Deliverables:

- Unified Gregorian timeline.
- Event aggregation.
- Calendar filters.
- Category filters.
- Search.
- Event details.
- Duplicate prevention.
- Source and verification information.

Acceptance criteria:

- Events from all four engines appear correctly.
- Original calendar dates remain accessible.
- Multiple events on one Gregorian date are supported.
- Different observances are not accidentally deleted.

## 14.7 MVP Phase 7: Finalization

Deliverables:

- Monthly calendar view.
- Daily event view.
- Date converter interface.
- Settings.
- Error handling.
- Database migration support.
- Documentation.
- Full regression testing.

Acceptance criteria:

- The application works offline with installed datasets.
- Bengali and English interfaces work independently of calendar selection.
- Core features pass their test suites.
- Data integrity is maintained across application restarts.

---

# 15. Out of Scope for Initial MVP

The following should not be included in the first release unless essential:

- Cloud synchronization.
- User accounts.
- Social features.
- Mobile applications.
- Complex personal scheduling.
- Automated scraping from unapproved websites.
- Multiple competing Panjika systems.
- Unverified astronomical calculations.
- AI-generated event dates.
- Large-scale historical calendar reconstruction.

These features can increase complexity without improving the reliability of the initial product.

---

# 16. Project Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Conflicting Panjika dates | Select and document one primary tradition. |
| Incorrect Bengali conversion | Use authoritative reference dates and boundary tests. |
| Unverified ISKCON dates | Prioritize official Mayapur publications. |
| Changing government holidays | Maintain year-specific datasets. |
| Duplicate events | Use identity-aware duplicate detection. |
| Missing source information | Require source metadata during imports. |
| Timezone mistakes | Preserve source timezone and use explicit timezone-aware handling. |
| Database corruption | Use transactions, backups and validation. |
| Scope expansion | Maintain strict MVP boundaries. |

---

# 17. Development Rules and Project Governance

The following rules are mandatory throughout development.

1. Each calendar engine must remain independent.
2. No calendar engine may borrow another engine's calculation rules without an explicitly documented and verified reason.
3. The Unified Event Manager must not calculate calendar dates itself.
4. UI components must not contain calendar calculation logic.
5. Event data must remain separate from calculation logic.
6. Original calendar dates must never be discarded.
7. Source URLs and verification information must be preserved.
8. No event date may be invented.
9. Existing working modules must not be rewritten without a technical reason.
10. Every development task must include implementation, tests and documentation.
11. Database changes must use controlled migrations.
12. Calendar calculation changes must include regression tests.
13. New yearly datasets must not require rewriting existing application modules.
14. Unverified data must never be presented as officially verified.

---

# 18. Final Product Definition

MultiCal will be considered a successful MVP when it can:

- Run as a stable desktop application.
- Display all four independent calendar systems.
- Support Bengali and English interfaces.
- Convert Bangladesh Bengali and Gregorian dates accurately.
- Display national holidays and observances.
- Display West Bengal Panjika information from one selected tradition.
- Display official ISKCON Mayapur observances.
- Combine all four systems on a unified Gregorian timeline.
- Filter and search events.
- Preserve original dates and source references.
- Import new yearly datasets.
- Maintain reliable database integrity.
- Operate offline with locally available calendar data.

## Final Architectural Principle

**One application. Four independent calendar engines. One unified event management layer. One reliable data foundation.**

MultiCal must unify the user experience without compromising the identity, rules or accuracy of any individual calendar system.

---

**Document Status:** PRD v1.0 — Initial Specification

**Next Development Stage:** Technical Architecture Design and Project Structure Planning.

**Implementation Status:** Not started.

**Important:** No application code should be written until the PRD has been reviewed and the technical architecture, calendar source selection and data requirements have been finalized.
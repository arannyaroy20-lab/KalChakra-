# MultiCal — Technical Architecture

**Project:** MultiCal  
**Document:** Technical Architecture  
**Version:** 1.0  
**Status:** Proposed  
**Architecture Style:** Modular Layered Architecture

---

# 1. Architecture Overview

## 1.1 Architectural Approach

MultiCal will use a modular layered architecture.

The system will contain four independent calendar engines connected through a common integration layer.

Each calendar engine will maintain its own:

- Calendar calculation rules.
- Calendar-specific date conversion.
- Event definitions and datasets.
- Source references.
- Validation rules.

The Unified Event Manager will provide a common interface for retrieving, filtering, searching and managing events across all four calendar systems.

The application will not combine different calendar calculation rules into one engine.

## 1.2 High-Level System Architecture

```text
                  MULTICAL DESKTOP APP
                          |
              ELECTRON APPLICATION LAYER
                          |
                  PRELOAD BRIDGE
                          |
                  REACT RENDERER
                          |
             APPLICATION SERVICE LAYER
                          |
        +-----------------+-----------------+
        |                 |                 |
   Calendar Registry   Unified Event    Localization
                          Manager          System
        |                 |
        |          +-----+------+
        |          |            |
        |       Event       Date Conversion
        |       Services       Manager
        |          |            |
        +----------+------------+
                   |
          INDEPENDENT CALENDAR ENGINES
                   |
       +-----------+-----------+-----------+
       |           |           |           |
    Bangladesh  Bangladesh   India       ISKCON
     National     Bengali    Bengali     Mayapur
      Engine       Engine     Engine      Engine
       |           |           |           |
       +-----------+-----------+-----------+
                   |
             DATA ACCESS LAYER
                   |
                 SQLite
                   |
          SOURCE & VERIFICATION
                 MANAGER
```

## 1.3 Main Architectural Principles

1. Calendar engines must remain independent.
2. Every engine must implement a common integration contract.
3. Calendar calculation logic must remain separate from event datasets.
4. All events must use a unified event representation.
5. Original calendar dates must be preserved.
6. Gregorian dates will be used as the common integration reference.
7. Source information must be traceable.
8. Unverified dates must never be presented as confirmed facts.
9. UI components must not contain calendar calculation logic.
10. Database operations must remain separate from business logic.

---

# 2. Technology Stack

| Technology | Responsibility |
|---|---|
| Electron | Desktop application framework |
| React | User interface |
| TypeScript | Application and domain logic |
| Vite | Renderer development and build |
| Tailwind CSS | UI styling |
| SQLite | Local database |
| i18next | Bengali and English localization |
| better-sqlite3 | SQLite access from Electron main process |
| Vitest | Unit and integration testing |
| React Testing Library | UI testing |
| Playwright | End-to-end testing |

### Recommended Decisions

**Electron Main Process**

Owns database access, application lifecycle, operating-system integration and IPC communication.

**React Renderer**

Owns presentation, navigation, user interaction and localized display.

**SQLite**

Provides a persistent local database without requiring a separate database server.

**i18next**

Manages interface translations independently from calendar data.

No additional backend server is required for the initial desktop MVP.

---

# 3. Complete Project Folder Structure

```text
MultiCal/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── CALENDAR_RULES.md
│   ├── DATA_SOURCES.md
│   └── DEVELOPMENT.md
│
├── electron/
│   ├── main/
│   │   ├── index.ts
│   │   ├── app-lifecycle.ts
│   │   ├── window-manager.ts
│   │   └── ipc/
│   │       ├── index.ts
│   │       ├── calendar.ipc.ts
│   │       ├── event.ipc.ts
│   │       └── settings.ipc.ts
│   │
│   └── preload/
│       └── index.ts
│
├── src/
│   │
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers/
│   │       ├── AppProvider.tsx
│   │       └── LocalizationProvider.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── calendar/
│   │   ├── events/
│   │   ├── navigation/
│   │   └── common/
│   │
│   ├── features/
│   │   ├── dashboard/
│   │   ├── calendar-view/
│   │   ├── event-details/
│   │   ├── search/
│   │   ├── settings/
│   │   └── source-information/
│   │
│   ├── core/
│   │   ├── types/
│   │   │   ├── calendar.types.ts
│   │   │   ├── event.types.ts
│   │   │   ├── date.types.ts
│   │   │   └── source.types.ts
│   │   │
│   │   ├── registry/
│   │   │   └── CalendarRegistry.ts
│   │   │
│   │   ├── events/
│   │   │   ├── UnifiedEventManager.ts
│   │   │   ├── EventRepository.ts
│   │   │   └── EventFilter.ts
│   │   │
│   │   ├── date-conversion/
│   │   │   ├── DateConversionManager.ts
│   │   │   └── GregorianDateAdapter.ts
│   │   │
│   │   ├── verification/
│   │   │   ├── SourceManager.ts
│   │   │   └── VerificationManager.ts
│   │   │
│   │   └── localization/
│   │       ├── i18n.ts
│   │       └── language-manager.ts
│   │
│   ├── calendars/
│   │   │
│   │   ├── bangladesh-national/
│   │   │   ├── index.ts
│   │   │   ├── engine.ts
│   │   │   ├── calculator.ts
│   │   │   ├── types.ts
│   │   │   ├── rules.ts
│   │   │   ├── repository.ts
│   │   │   └── data/
│   │   │       └── events.json
│   │   │
│   │   ├── bangladesh-bengali/
│   │   │   ├── index.ts
│   │   │   ├── engine.ts
│   │   │   ├── calculator.ts
│   │   │   ├── types.ts
│   │   │   ├── rules.ts
│   │   │   ├── repository.ts
│   │   │   └── data/
│   │   │       └── events.json
│   │   │
│   │   ├── india-bengali/
│   │   │   ├── index.ts
│   │   │   ├── engine.ts
│   │   │   ├── calculator.ts
│   │   │   ├── types.ts
│   │   │   ├── rules.ts
│   │   │   ├── repository.ts
│   │   │   └── data/
│   │   │       └── events.json
│   │   │
│   │   └── iskcon-mayapur/
│   │       ├── index.ts
│   │       ├── engine.ts
│   │       ├── calculator.ts
│   │       ├── types.ts
│   │       ├── rules.ts
│   │       ├── repository.ts
│   │       └── data/
│   │           └── events.json
│   │
│   ├── database/
│   │   ├── connection.ts
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql
│   │   │   └── 002_source_tables.sql
│   │   ├── repositories/
│   │   │   ├── EventRepository.ts
│   │   │   ├── SourceRepository.ts
│   │   │   └── CalendarRepository.ts
│   │   └── seed/
│   │       └── seed.ts
│   │
│   ├── services/
│   │   ├── CalendarService.ts
│   │   ├── EventService.ts
│   │   ├── SearchService.ts
│   │   └── SettingsService.ts
│   │
│   ├── locales/
│   │   ├── en/
│   │   │   └── translation.json
│   │   └── bn/
│   │       └── translation.json
│   │
│   ├── shared/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── errors/
│   │
│   └── main.tsx
│
├── tests/
│   ├── unit/
│   │   ├── calendars/
│   │   ├── date-conversion/
│   │   └── events/
│   │
│   ├── integration/
│   │   ├── calendar-registry/
│   │   ├── event-manager/
│   │   └── database/
│   │
│   └── e2e/
│       ├── calendar.spec.ts
│       └── events.spec.ts
│
├── scripts/
│   ├── validate-calendar-data.ts
│   └── import-events.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

This structure is the proposed target structure. Existing project files should be inspected before implementation, and working modules should be preserved.

---

# 4. Core Module Responsibilities

## 4.1 Calendar Registry

The Calendar Registry manages the registration and discovery of all calendar engines.

Responsibilities:

- Register calendar engines.
- Maintain calendar identifiers.
- Retrieve an engine by ID.
- List available calendars.
- Provide calendar metadata.
- Enable or disable calendar availability.

It must not implement calendar calculations.

## 4.2 Unified Event Manager

This is the central event integration component.

Responsibilities:

- Retrieve events from all registered engines.
- Retrieve events from a particular calendar.
- Search events.
- Filter by event category.
- Filter by date.
- Combine results without merging their original identities.
- Maintain consistent event output.

The manager does not calculate calendar dates.

## 4.3 Date Conversion Manager

Responsibilities:

- Convert supported calendar dates into Gregorian dates.
- Convert Gregorian dates into supported calendar representations.
- Route conversions to the correct calendar-specific adapter.
- Validate conversion results.
- Preserve timezone and date-only semantics.

It must never apply one calendar's rules to another calendar.

## 4.4 Source and Verification Manager

Responsibilities:

- Maintain source information.
- Record source URLs and publication details.
- Track verification status.
- Associate sources with individual events.
- Maintain verification history.
- Identify conflicting source information.

## 4.5 Localization System

Responsibilities:

- Support Bengali and English.
- Translate interface labels.
- Translate navigation and settings.
- Display event titles in their available languages.
- Maintain language fallback behavior.

Calendar calculation must never depend on interface language.

## 4.6 Database Layer

Responsibilities:

- Store events.
- Store calendar metadata.
- Store source references.
- Store verification records.
- Manage database migrations.
- Provide repository interfaces.

Only the trusted database layer in Electron Main Process should access the SQLite file.

---

# 5. Independent Calendar Engine Architecture

Each calendar engine follows the same external contract but maintains its own internal implementation.

## 5.1 Common Calendar Engine Interface

```typescript
interface CalendarEngine {
  readonly id: string;
  readonly name: string;

  getMetadata(): CalendarMetadata;

  getEventsForDate(
    date: GregorianDate
  ): Promise<CalendarEvent[]>;

  getEventsForMonth(
    year: number,
    month: number
  ): Promise<CalendarEvent[]>;

  convertToGregorian(
    date: CalendarDate
  ): GregorianDate;

  convertFromGregorian(
    date: GregorianDate
  ): CalendarDate;
}
```

The exact methods may be extended according to individual engine requirements.

## 5.2 Bangladesh National Calendar Engine

Identifier:

`bd-national`

Responsibilities:

- Government holidays.
- National days.
- Religious observances.
- Historical events.
- Cultural events.
- International observances.
- Distinguish official public holidays from ordinary observances.

Calculation logic and event data must remain separate.

Official government holiday declarations should be treated as authoritative for public holiday status.

## 5.3 Bangladesh Bengali Calendar Engine

Identifier:

`bd-bengali`

Responsibilities:

- Implement the revised official Bangladesh Bengali calendar.
- Support all 12 Bengali months.
- Calculate Bengali dates.
- Support Bengali year conversion.
- Provide Bengali calendar event dates.

The calculation rules must be based on the officially adopted Bangladesh calendar system.

It must not import West Bengal Panjika calculations.

## 5.4 India Bengali Calendar Engine

Identifier:

`in-bengali`

Responsibilities:

- Follow the traditional West Bengal Bengali Panjika.
- Support traditional Bengali month and year calculations.
- Preserve Panjika-specific date information.
- Support traditional observances and festival dates.

It must maintain its own rules and data.

It must not use the revised Bangladesh Bengali calendar algorithm.

## 5.5 ISKCON Mayapur Calendar Engine

Identifier:

`iskcon-mayapur`

Responsibilities:

- Follow the official ISKCON Mayapur calendar.
- Support Vaishnava observances.
- Maintain tithi information.
- Maintain fasting and festival observances.
- Support Ekadashi and associated observances.
- Preserve observance-specific rules and dates.

Its astronomical and religious calculation requirements must remain independent from both Bengali calendar engines.

The official Mayapur calendar should be the primary reference for published observance dates.

---

# 6. Engine Communication Architecture

The four engines communicate with the application through the Calendar Registry and Unified Event Manager.

Example:

```text
                CalendarService
                      |
                CalendarRegistry
                      |
        +-------------+-------------+
        |             |             |
   BD National   BD Bengali    India Bengali
        |             |             |
        +-------------+-------------+
                      |
                 ISKCON Engine
                      |
              Unified Event Manager
                      |
               Event Normalization
                      |
                Common Event API
                      |
                 React UI
```

### Communication Workflow

1. The UI requests events for a date.
2. CalendarService receives the request.
3. CalendarRegistry identifies the requested engines.
4. UnifiedEventManager requests events from those engines.
5. Each engine retrieves its own data.
6. Each engine converts or interprets dates using its own rules.
7. Results are normalized into the common event interface.
8. Source and verification information is attached.
9. The unified result is returned to the UI.

An engine must never directly depend on another engine.

---

# 7. Unified Event Data Structure

All four engines must provide events using a common interface.

## 7.1 TypeScript Interfaces

```typescript
type CalendarId =
  | "bd-national"
  | "bd-bengali"
  | "in-bengali"
  | "iskcon-mayapur";

type EventCategory =
  | "national"
  | "public-holiday"
  | "religious"
  | "cultural"
  | "historical"
  | "international"
  | "astronomical"
  | "other";

type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "disputed";

interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

interface CalendarDate {
  calendarId: CalendarId;
  year: number;
  month: number;
  day: number;
  originalLabel?: string;
}

interface CalendarEvent {
  id: string;

  calendarId: CalendarId;

  title: {
    en?: string;
    bn?: string;
  };

  description?: {
    en?: string;
    bn?: string;
  };

  category: EventCategory;

  startDate: GregorianDate;
  endDate?: GregorianDate;

  originalDate?: CalendarDate;

  isPublicHoliday: boolean;

  verificationStatus: VerificationStatus;

  sourceIds: string[];

  timezone?: string;

  metadata?: Record<string, unknown>;
}
```

## 7.2 Important Rules

- Every event must have a unique ID.
- Every event must identify its originating calendar.
- Gregorian dates are used for common event querying.
- Original calendar dates must be preserved.
- Public holiday status must not be inferred from event category.
- Event source information must remain accessible.
- Unknown information must not be fabricated.

---

# 8. Date Conversion Architecture

Date conversion is one of the most important components of MultiCal.

## 8.1 Common Date Reference

Gregorian dates will serve as the common integration reference.

Each engine maintains its own conversion implementation.

```text
                  Gregorian Date
                         |
                DateConversionManager
                         |
             +-----------+-----------+
             |           |           |
         BD Bengali  India Bengali  ISKCON
          Adapter      Adapter     Adapter
             |           |           |
        Independent  Independent  Independent
          Rules        Rules       Rules
```

## 8.2 Conversion Responsibilities

Each calendar adapter must implement:

- Gregorian to native calendar conversion.
- Native calendar to Gregorian conversion.
- Date validation.
- Leap-year or calendar-specific year handling.
- Month boundary handling.
- Conversion consistency tests.

The Bangladesh National Calendar may use Gregorian dates directly for national event scheduling where appropriate.

## 8.3 Date and Time Handling

Use date-only representations for all-day events.

Do not store an all-day date as an arbitrary UTC timestamp.

Use explicit IANA timezones when an event depends on local astronomical or religious timing.

Recommended timezone identifiers:

- Bangladesh: `Asia/Dhaka`
- West Bengal: `Asia/Kolkata`
- Mayapur: `Asia/Kolkata`

## 8.4 Important Restrictions

- Never use Bangladesh Bengali conversion rules for India Bengali dates.
- Never calculate ISKCON tithi using ordinary Gregorian month rules.
- Never assume a festival occurs on the same Gregorian date every year.
- Never discard original calendar dates after conversion.

---

# 9. Database Architecture

SQLite will be the primary local persistence layer.

The database should use normalized relational tables.

## 9.1 Database Tables

### calendars

Stores calendar definitions.

| Column | Type | Description |
|---|---|---|
| id | TEXT PK | Calendar identifier |
| name | TEXT | Calendar name |
| description | TEXT | Description |
| is_enabled | INTEGER | Availability |
| created_at | TEXT | Creation timestamp |

### events

Stores unified event records.

| Column | Type | Description |
|---|---|---|
| id | TEXT PK | Unique event ID |
| calendar_id | TEXT FK | Originating calendar |
| title_en | TEXT | English title |
| title_bn | TEXT | Bengali title |
| description_en | TEXT | English description |
| description_bn | TEXT | Bengali description |
| category | TEXT | Event category |
| start_date | TEXT | Gregorian start date |
| end_date | TEXT | Gregorian end date |
| is_public_holiday | INTEGER | Holiday indicator |
| verification_status | TEXT | Verification status |
| timezone | TEXT | Relevant timezone |
| metadata_json | TEXT | Calendar-specific metadata |
| created_at | TEXT | Creation timestamp |
| updated_at | TEXT | Last update |

### event_original_dates

Preserves the original calendar date.

| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Record ID |
| event_id | TEXT FK | Event reference |
| calendar_id | TEXT FK | Calendar reference |
| year | INTEGER | Original year |
| month | INTEGER | Original month |
| day | INTEGER | Original day |
| original_label | TEXT | Original date text |

### sources

Stores source information.

| Column | Type | Description |
|---|---|---|
| id | TEXT PK | Source ID |
| name | TEXT | Source name |
| url | TEXT | Source URL |
| publisher | TEXT | Publisher |
| source_type | TEXT | Official, institutional, etc. |
| accessed_at | TEXT | Last access date |

### event_sources

Connects events with sources.

| Column | Type | Description |
|---|---|---|
| event_id | TEXT FK | Event reference |
| source_id | TEXT FK | Source reference |
| source_note | TEXT | Supporting information |

Composite primary key: `(event_id, source_id)`.

### verification_records

Stores verification history.

| Column | Type | Description |
|---|---|---|
| id | TEXT PK | Verification record |
| event_id | TEXT FK | Event reference |
| status | TEXT | Verification status |
| verified_by | TEXT | Reviewer |
| verified_at | TEXT | Verification date |
| notes | TEXT | Verification notes |

### settings

Stores application preferences.

| Column | Type | Description |
|---|---|---|
| key | TEXT PK | Setting name |
| value | TEXT | Setting value |

## 9.2 Database Relationships

```text
calendars
    |
    | 1:N
    |
  events
    |
    +------ event_original_dates
    |
    +------ event_sources ------ sources
    |
    +------ verification_records

settings
    |
    +------ Application Preferences
```

## 9.3 Database Rules

- Use foreign key constraints.
- Enable SQLite foreign key enforcement.
- Use transactions for multi-table updates.
- Add indexes on calendar_id and start_date.
- Add indexes for common event search operations.
- Use migrations for schema changes.
- Never store source references only inside unstructured event descriptions.

---

# 10. Source and Verification Workflow

MultiCal must prioritize data accuracy.

## 10.1 Source Hierarchy

Sources should be evaluated according to calendar type.

Examples:

| Calendar | Preferred Source |
|---|---|
| Bangladesh National | Government publications |
| Bangladesh Bengali | Official Bangladesh calendar rules |
| India Bengali | Established West Bengal Panjika references |
| ISKCON Mayapur | Official ISKCON Mayapur calendar |

## 10.2 Verification Workflow

```text
       Event Data Collection
                |
                v
          Source Recording
                |
                v
        Event Date Validation
                |
                v
        Source Cross-Checking
                |
                v
        Verification Review
                |
          +-----+-----+
          |           |
        Pass         Conflict
          |           |
          v           v
       Verified     Disputed
          |
          v
       Database
```

## 10.3 Verification Rules

1. Every event should have at least one recorded source.
2. Important dates should be checked against authoritative references.
3. Conflicting dates must be flagged.
4. Unverified dates must not be marked verified.
5. Verification history must be preserved.
6. Changes to official dates must be documented.

For astronomical or tithi-dependent observances, the relevant location and timezone must also be recorded.

---

# 11. Electron Application Architecture

Electron will provide the desktop environment.

It has three primary components.

## 11.1 Main Process

Responsibilities:

- Application lifecycle.
- Window management.
- SQLite connection.
- Database operations.
- IPC registration.
- Application-level error handling.
- Local data management.

The Main Process owns the database connection.

## 11.2 Preload Process

Responsibilities:

- Expose a restricted application API.
- Provide safe communication between renderer and main.
- Validate IPC request shapes.
- Avoid exposing Node.js or unrestricted Electron APIs.

Example:

```typescript
interface MultiCalAPI {
  getCalendars(): Promise<CalendarMetadata[]>;

  getEvents(date: GregorianDate): Promise<CalendarEvent[]>;

  searchEvents(query: string): Promise<CalendarEvent[]>;

  getSettings(): Promise<Record<string, string>>;
}
```

Expose this API through `contextBridge`.

## 11.3 Renderer Process

Responsibilities:

- React interface.
- Calendar display.
- Event presentation.
- Navigation.
- Search interface.
- Localization.
- User preferences.

The Renderer must not access SQLite directly.

## 11.4 Communication Flow

```text
React Component
      |
      v
Preload API
      |
      v
IPC Request
      |
      v
Electron Main
      |
      v
Application Services
      |
      v
Database / Calendar Engines
      |
      v
IPC Response
      |
      v
React Component
```

---

# 12. Security Considerations

Electron security is essential.

Recommended configuration:

```typescript
new BrowserWindow({
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true
  }
});
```

Additional security requirements:

1. Never expose unrestricted Node.js APIs to the renderer.
2. Use explicit IPC channels.
3. Validate all IPC inputs.
4. Restrict navigation to trusted application content.
5. Apply a Content Security Policy.
6. Avoid executing remote code.
7. Keep database operations in the Main Process.
8. Use parameterized SQL queries.
9. Validate imported calendar data.
10. Store application data in Electron's user data directory.

---

# 13. Error Handling Strategy

Use centralized application error types.

```typescript
type MultiCalErrorCode =
  | "CALENDAR_NOT_FOUND"
  | "INVALID_DATE"
  | "DATE_CONVERSION_FAILED"
  | "EVENT_NOT_FOUND"
  | "DATABASE_ERROR"
  | "SOURCE_NOT_FOUND"
  | "VERIFICATION_FAILED"
  | "IPC_ERROR";
```

Example:

```typescript
class MultiCalError extends Error {
  constructor(
    public code: MultiCalErrorCode,
    message: string
  ) {
    super(message);
    this.name = "MultiCalError";
  }
}
```

### Error Handling Principles

- Calendar-specific errors should remain isolated.
- One engine failing should not unnecessarily crash the entire application.
- Database failures should be logged.
- Invalid dates should be rejected.
- User-facing errors should be understandable.
- Technical errors should contain diagnostic information.
- Do not silently replace failed calculations with invented dates.

---

# 14. Testing Architecture

Testing is mandatory for all calendar engines.

## 14.1 Unit Testing

Test individual functions.

Examples:

- Bengali date calculation.
- Gregorian conversion.
- Month boundaries.
- Leap-year handling.
- Event filtering.
- Source validation.

Each calendar engine must have its own test suite.

## 14.2 Integration Testing

Test:

- Calendar Registry.
- Unified Event Manager.
- Date Conversion Manager.
- Database repositories.
- Source Manager.
- IPC communication.

## 14.3 End-to-End Testing

Test complete user workflows:

1. Application startup.
2. Calendar navigation.
3. Event retrieval.
4. Event details.
5. Language switching.
6. Search and filtering.
7. Settings persistence.

## 14.4 Calendar Accuracy Testing

This is especially important.

Each engine must have independently verified reference dates.

Tests must cover:

- New year boundaries.
- Month transitions.
- Leap years.
- Religious observances.
- Multi-day events.
- Timezone-sensitive dates.
- Historical calendar conversions where supported.

Never use one calendar engine's output as the sole expected result for another engine.

---

# 15. Data Update and Maintenance Strategy

MultiCal should support controlled local data updates.

## 15.1 Initial Data Loading

During initial application setup:

1. Create the SQLite database.
2. Apply migrations.
3. Register the four calendars.
4. Import verified event datasets.
5. Register source references.
6. Validate imported data.

## 15.2 Future Updates

Use versioned datasets.

Each dataset should contain:

- Calendar ID.
- Dataset version.
- Update date.
- Source information.
- Event records.
- Verification information.

Updates should use database transactions.

A failed update must not leave partially imported event records.

## 15.3 Maintenance Rules

- Calendar rules must be version controlled.
- Event datasets must be independently maintained.
- Source changes must be documented.
- Official calendar updates must be reflected carefully.
- Historical records must not be overwritten without justification.
- Database migrations must be tested before release.

---

# 16. Development Sequence and Dependencies

Development should proceed in controlled phases.

## Phase 1 — Project Foundation

Implement:

- Electron configuration.
- React and Vite setup.
- TypeScript configuration.
- Tailwind CSS.
- Project structure.
- Basic application window.

Dependency: None.

## Phase 2 — Core Architecture

Implement:

- Common TypeScript interfaces.
- Calendar Registry.
- Unified Event Manager.
- Date Conversion Manager.
- Error handling.

Dependency: Phase 1.

## Phase 3 — Database Foundation

Implement:

- SQLite connection.
- Database schema.
- Migrations.
- Repositories.
- Initial seed system.

Dependency: Phase 2.

## Phase 4 — Bangladesh National Calendar

Implement:

- National calendar engine.
- Holiday data.
- National event data.
- Source tracking.
- Validation tests.

Dependency: Phases 2 and 3.

## Phase 5 — Bangladesh Bengali Calendar

Implement:

- Revised Bangladesh Bengali rules.
- Bengali date conversion.
- Month and year handling.
- Reference tests.

Dependency: Phases 2 and 3.

## Phase 6 — India Bengali Calendar

Implement:

- West Bengal Panjika integration.
- Independent date calculations.
- Traditional calendar representation.
- Reference tests.

Dependency: Phases 2 and 3.

## Phase 7 — ISKCON Mayapur Calendar

Implement:

- Mayapur calendar engine.
- Tithi and observance data.
- Fasting information.
- Location and timezone handling.
- Reference validation.

Dependency: Phases 2 and 3.

## Phase 8 — Localization

Implement:

- Bengali interface.
- English interface.
- Language switching.
- Translation fallback.

Dependency: Phase 1 and core interfaces.

## Phase 9 — Application Integration

Implement:

- Unified calendar view.
- Event display.
- Event details.
- Search.
- Filtering.
- Source information display.

Dependency: Calendar engines and core architecture.

## Phase 10 — Quality Assurance

Implement:

- Full test suite.
- Calendar accuracy verification.
- Database integrity testing.
- Electron security review.
- Performance checks.

Dependency: Previous phases.

## Phase 11 — Desktop Release

Implement:

- Production build.
- Application packaging.
- Database initialization.
- Version management.
- Release documentation.

Dependency: Phase 10.

---

# 17. Final Architecture Decisions

The following decisions are considered foundational.

| Area | Decision |
|---|---|
| Architecture | Modular layered |
| Desktop framework | Electron |
| Frontend | React |
| Language | TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Database | SQLite |
| Localization | i18next |
| Integration | Unified Event Manager |
| Calendar discovery | Calendar Registry |
| Date reference | Gregorian |
| Calendar calculations | Four independent engines |
| Data persistence | SQLite |
| Verification | Source-based verification |
| Testing | Vitest + React Testing Library + Playwright |

## 17.1 Non-Negotiable Architectural Rules

1. No shared calculation engine between the four calendars.
2. No direct dependency between individual calendar engines.
3. No calendar calculation logic inside React components.
4. No direct SQLite access from the Renderer.
5. No loss of original calendar dates.
6. No invented or unverified event dates presented as confirmed.
7. No mixing of Bangladesh and West Bengal Bengali calendar rules.
8. No mixing of ISKCON observance rules with ordinary Bengali calendar calculations.
9. All engines must implement the common calendar integration contract.
10. All development must include implementation, testing and documentation.

---

# 18. Conclusion

MultiCal will use four independent calendar engines connected through a unified application architecture.

The Calendar Registry will manage engine discovery.

The Unified Event Manager will provide a consistent event interface.

The Date Conversion Manager will coordinate calendar-specific conversions without mixing their rules.

The Source and Verification Manager will preserve data reliability and traceability.

SQLite will provide local persistence, while Electron and React will deliver the desktop experience.

This architecture is designed to support an initial maintainable MVP while allowing future expansion without rewriting the four foundational calendar engines.

**Architecture Status: Proposed — Ready for Technical Review.**
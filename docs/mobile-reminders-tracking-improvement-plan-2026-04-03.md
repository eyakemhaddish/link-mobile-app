# Mobile Reminders, Tracking, and Device Integration Improvement Plan

## Purpose

This plan turns the patient app into a stronger day-to-day care companion, with medication reminders as the first priority and local notifications as the foundation. It is grounded in the current mobile codebase rather than a greenfield design.

## Current State

The app already has useful building blocks:

- Patient appointments exist in the UI and service layer:
  - [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js)
  - [src/services/patientService.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/services/patientService.js)
- Symptom logging already exists through the patient portal contract:
  - [src/screens/SymptomCheckerConversationalScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerConversationalScreen.js)
  - [src/services/patientService.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/services/patientService.js)
- The app is already offline-aware and has encrypted local storage primitives:
  - [src/lib/db/database.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/lib/db/database.js)
  - [src/lib/db/schema.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/lib/db/schema.js)
  - [src/services/syncService.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/services/syncService.js)
- The codebase already tracks device identity, which helps for per-device reminder scheduling and sync:
  - [src/services/syncService.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/services/syncService.js)

The app does not yet have the core pieces needed for this feature set:

- No local notifications implementation or notification permission flow.
- No patient-side reminder engine or scheduling service.
- No patient-side health tracking data model for BP, glucose, weight, sleep, or mood.
- No graphing/charting layer.
- No caregiver notification workflow.
- No device integration stack for Bluetooth, Health Connect, or Apple Health.

Dependency gap today:

- Current `package.json` does not include a notifications package, charts library, or device integration SDKs:
  - [package.json](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/package.json)

## Product Direction

The right production approach is:

1. Ship local, offline-first medication reminders first.
2. Add smart reminder expansion on top of the same scheduler.
3. Add daily health tracking with simple graphs and threshold alerts.
4. Add caregiver and safety flows only after core reliability is proven.
5. Add device integration last, behind feature flags, because it increases platform complexity and testing cost.

## What To Build First

### Phase 1: Foundation for local reminders

Goal: make reminders work reliably on-device without depending on network access.

Scope:

- Add local notifications support.
- Add notification permissions UI and settings.
- Add a reminder scheduler service.
- Add local reminder persistence in SQLite.
- Add reminder audit state:
  - scheduled
  - delivered
  - completed
  - skipped
  - snoozed
  - missed
- Add a reminder center screen in the patient app.

Recommended technical additions:

- `expo-notifications` for local notifications.
- A reminder repository and scheduler service:
  - `src/repositories/reminderRepo.js`
  - `src/services/reminderService.js`
  - `src/services/notificationService.js`
- New SQLite tables in [src/lib/db/schema.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/lib/db/schema.js):
  - `reminders`
  - `reminder_occurrences`
  - `health_tracking_entries`
  - `caregiver_contacts`
  - `device_measurements`

Key product constraints:

- Notifications must work offline.
- Reminders must survive app restarts.
- Scheduling must be battery-conscious.
- The system must support flexible timing and snooze.

### Phase 2: Medication reminders

Goal: deliver the most important feature first.

Scope:

- Medication schedule creation and editing.
- Dose timing by frequency and daypart.
- Dose instructions:
  - morning/noon/night icons
  - take with food
  - special notes
- Completion flow:
  - taken
  - skipped
  - snoozed
- Missed-dose handling.
- Adherence summary and streaks.

Nice-to-have within this phase:

- Side-effect check-ins after selected medications.
- Drug interaction warning surface if the backend already has medication knowledge support.

Data model additions:

- medication name
- dose
- units
- frequency
- schedule windows
- food instructions
- start date
- end date
- active flag
- reminder enabled flag

Backend expectation:

- The app can start locally first, but long-term the backend should own the canonical medication schedule for cross-device continuity.
- If backend medication schedule endpoints do not exist yet, document that as a separate backend contract item before broad rollout.

### Phase 3: Smart reminders beyond medication

Goal: reuse the same engine for broader patient support.

Add support for:

- Appointment reminders
- Refill reminders
- Lab test reminders
- Vaccination reminders
- Hydration reminders
- Exercise and walk nudges
- Rehab exercise prompts
- Diet or meal reminders

Important rule:

- Do not build separate schedulers per feature. Use one reminder engine with reminder types and trigger rules.

Adaptive reminder upgrade:

- Track whether reminders are usually completed on time, snoozed, or ignored.
- Shift reminder windows based on actual behavior.
- Example:
  - if the user consistently takes a dose 20 minutes late, shift the default reminder later
  - if morning reminders are ignored but 30-minute follow-ups succeed, schedule a secondary prompt automatically

## Daily Health Tracking

### Phase 4: Manual tracking and simple trends

Start with manual entry for:

- Blood pressure
- Blood sugar
- Weight
- Pain score
- Symptom severity
- Sleep duration
- Mood

Why this order:

- BP, glucose, and weight are high-value for chronic care.
- Pain, symptom severity, and mood pair naturally with the existing symptom-checker direction.
- Sleep can stay simple at first.

UI requirements:

- One quick-entry screen
- One history screen
- One trend screen with simple charts
- Alerts for values outside thresholds

Alert examples:

- "Your blood pressure is higher than your recent average."
- "This reading may need same-day follow-up."
- "You have logged worsening pain for 3 days."

Recommended implementation notes:

- Keep charting simple and lightweight.
- Prefer line charts and threshold bands over complicated dashboards.
- Add patient-configurable units and normal ranges where clinically appropriate.

## Symptom and Check-In Tools

### Phase 5: Lightweight daily check-ins

This fits well with the existing symptom checker and symptom log endpoint.

Scope:

- Daily "How are you feeling?" prompt
- Symptom severity slider
- Mood check-in
- Free-text note
- Optional escalation into the conversational symptom checker

This should integrate with:

- [src/screens/SymptomCheckerScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerScreen.js)
- [src/screens/SymptomCheckerConversationalScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerConversationalScreen.js)

Expected outcome:

- The portal answers not only "Did you take your meds?" but also:
  - how are you feeling
  - are you improving
  - what should you do next

## Alerts and Safety Features

### Phase 6: Clinical and caregiver escalation

Only build this after reminder reliability is proven.

Add:

- Missed medication alerts
- Abnormal reading alerts
- Emergency quick-call button
- Inactivity follow-up prompts
- Optional caregiver escalation

Rules:

- Alert thresholds must be configurable and clinically reviewed.
- Emergency prompts must avoid pretending to be a diagnosis system.
- Caregiver notifications must be opt-in, explicit, and revocable.

Caregiver features:

- Caregiver contact management
- Notify caregiver when:
  - meds are repeatedly missed
  - appointments are skipped
  - abnormal readings breach configured thresholds
- Shared care plan summary

## Device Integration

### Phase 7: Device integration after manual tracking is stable

This is important, but it should not block the first release.

Target integrations:

- Bluetooth BP cuffs
- Bluetooth glucometers
- Smart scales
- Health Connect on Android
- Apple Health on iOS

Implementation guidance:

- Start with import/sync, not two-way device control.
- Create a device abstraction layer rather than coding directly into screens.
- Separate source metadata:
  - manual
  - bluetooth
  - health_connect
  - apple_health

Suggested modules:

- `src/services/deviceIntegrationService.js`
- `src/services/healthDataImportService.js`
- `src/repositories/deviceMeasurementRepo.js`

Risks:

- BLE support introduces major Android testing overhead.
- Health Connect and Apple Health require platform-specific permission and store compliance work.
- Device data needs careful timestamp, unit, and provenance handling.

## Notifications Strategy

Local notifications are the core requirement.

Production rules:

- Schedule reminders locally on-device.
- Keep backend sync optional, not required for firing notifications.
- Reschedule all active reminders after app restart, reinstall recovery, or schedule changes.
- Use backend only for canonical plans, analytics, and cross-device sync.

Notification types to support:

- medication
- appointment
- refill
- lab
- vaccine
- hydration
- exercise
- symptom_checkin
- abnormal_reading_followup

User controls required:

- enable/disable all reminders
- per-category toggle
- snooze duration
- quiet hours
- caregiver escalation toggle

## Recommended Delivery Order

### Release 1

- Local notifications foundation
- Medication reminders
- Snooze and taken/skipped actions
- Reminder settings
- Local persistence

### Release 2

- Appointment, refill, lab, and vaccination reminders
- Hydration reminders
- Daily check-ins
- Simple adherence summaries

### Release 3

- BP, glucose, weight, pain, symptom, sleep, and mood tracking
- Trend charts
- Basic abnormal-value alerts

### Release 4

- Caregiver integration
- Inactivity follow-ups
- Adaptive reminder timing

### Release 5

- Device integration
- Health Connect / Apple Health import
- Bluetooth peripherals

## Engineering Work Breakdown

### Mobile app changes

- Add notifications dependency and native config.
- Add notification permission flow.
- Add reminder data model and repositories.
- Add reminder scheduling service.
- Add patient reminder UI.
- Add health tracking UI and repositories.
- Add charting support.
- Add caregiver settings UI.
- Add device integration abstraction layer.

### Backend and contract changes

- Confirm medication schedule source of truth.
- Confirm appointment reminder data shape.
- Confirm refill reminder source and stock logic.
- Add caregiver relationship endpoints if not already present.
- Add tracking sync endpoints if patient-entered health metrics should be shared with providers.
- Define abnormal-reading alert policies.

### QA and release work

- Offline reminder reliability tests
- Background and reboot scheduling tests
- Permission denial tests
- Timezone and daylight-saving tests
- Low-battery behavior tests
- Duplicate reminder prevention tests
- Cross-device sync reconciliation tests

## Risks and Decisions

### High-risk items

- Shipping reminder logic before local notification reliability is proven
- Building device integration too early
- Hard-coding clinical alert thresholds without review
- Requiring network connectivity for reminders

### Decisions to make before implementation

1. Should medication schedules be backend-authored, patient-authored, or both?
2. Should caregiver alerts be in-app only, push notification based, or SMS backed?
3. Which health metrics are in scope for the first patient-facing tracking release?
4. Is device integration limited to import-only in v1?
5. Do abnormal reading alerts stay informational, or do they trigger clinical workflows?

## Recommended Next Step

Start with a scoped implementation spec for Release 1 only:

- local notifications
- medication reminders
- snooze/taken/skipped workflow
- reminder persistence
- reminder settings

That is the highest-value path, aligns with the current app architecture, and gives the rest of this roadmap a stable platform to build on.

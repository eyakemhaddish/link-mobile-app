# Daily Implementation Guide

## Date

2026-04-06

## Objective for today

Finish the most important patient portal foundations in priority order:

0. Registration and login
1. Visits history and active visit details
2. Facility finder
3. UI implementation using `docs/UI design` styling and format, but with scalable app architecture

This document is the working guide for daily execution, not a long-range roadmap.

## Non-negotiable product rules for today

- The patient must be able to create an account even if they are not registered in any facility.
- The patient must be able to view visit history.
- The patient must be able to view active visit details.
- Active visit details must include visit stage, orders, and results where available.
- Facility finder must be usable and connected to appointment booking flow.
- UI should follow the look and format direction in `docs/UI design`, but implementation must not hardcode one-off colors, sizes, or brittle layout logic directly into screen code.

## Implementation priority

## Priority 0: Registration and login

### Goal

Patient can create an account and sign in even when they are not already linked to a facility.

The new intended patient auth model is:

1. first-time patient enters phone number
2. patient receives OTP
3. patient verifies OTP
4. if no patient exists, patient completes registration
5. patient creates a password during registration
6. account is created and session starts
7. on later returns, patient signs in with password
8. phone number is fetched from the device and shown as prefilled, not editable, on the patient sign-in screen

### Current implementation base

- [src/screens/LoginScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/LoginScreen.js)
- [src/context/AuthContext.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/context/AuthContext.js)
- [src/lib/api.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/lib/api.js)

### Current backend flow

- `POST /api/v1/patient-auth/request-otp`
- `POST /api/v1/patient-auth/verify-otp`
- `POST /api/v1/patient-auth/register`
- `POST /api/v1/patient-auth/sign-in`
- `GET /api/v1/patient-auth/me`

### Target auth behavior to implement

- first-time registration uses OTP plus registration form plus password creation
- later patient sign-in uses:
  - stored phone number from device
  - patient-entered password
- clinician password flow remains separate from patient password flow

### Expected backend contract changes or confirmations

We need the patient auth contract to support:

- OTP verification for first-time phone ownership
- patient registration with password creation
- patient password login on later sign-in
- patient profile/session fetch after password login

### What must be true today

- user enters phone number
- user receives OTP
- user verifies OTP
- if no patient exists, app moves into registration flow
- registration form includes password creation
- registration succeeds without requiring facility membership
- app creates a patient session and lands the user in the patient app
- later patient sign-in screen uses the device phone number as a prefilled, non-editable field
- later patient sign-in only asks for password

### Required checks

- confirm registration does not require facility selection
- confirm registration payload works with only:
  - phone number
  - otp
  - name
  - password
  - optional patient profile fields
- confirm post-registration token/session is accepted by app auth flow
- confirm patient password login endpoint and payload
- confirm `GET /patient-auth/me` returns a usable patient profile after registration and password login
- confirm how phone number is stored/retrieved on device for later patient sign-in

### Smoke test status on 2026-04-06

- backend seed completed successfully through `GET /api/v1/seed`
- test phone number: `+251922335151`
- `POST /api/v1/patient-auth/request-otp` is reachable and accepts the raw request body shape:
  - `{ "phone_number": "+251922335151" }`
- the endpoint is currently blocked by a backend database error, not a mobile request-shape error:
  - `Npgsql.PostgresException: column "patient_id" of relation "otp_codes" does not exist`
- because OTP request currently fails server-side, full registration and password sign-in smoke testing cannot complete yet
- `GET /api/v1/facilities/public` is working
- `GET /api/v1/patient-portal/facilities` returns `401 Unauthorized` without a patient token, which is expected

### Acceptance criteria

- new patient with no facility can register successfully
- new patient creates a password during registration
- returning patient can sign in with password successfully
- returning patient does not need to re-enter phone number manually
- patient lands in the authenticated patient shell after success
- error states are clear and actionable

## Priority 1: Visit history and active visit details

### Goal

Patient can clearly see:

- previous visits
- current active visits
- orders attached to each visit
- available results and outputs from the visit

### Current implementation base

- [src/services/patientService.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/services/patientService.js)
- [src/screens/HomeScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/HomeScreen.js)
- [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js)
- [src/utils/journeyMapper.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/utils/journeyMapper.js)

### Current relevant API usage

- `GET /api/v1/mobile/patient/active-visit`
- `GET /api/v1/mobile/patient/visit-history`
- `GET /api/v1/visits/{id}`
- `GET /api/v1/mobile/patient/records`

### Backend contract update

Do not keep the mobile app coupled to `GET /api/v1/visits/{id}` for patient visit detail.

Use the dedicated patient-facing contract documented in:

- [docs/patient-visit-contract-spec-2026-04-06.md](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/docs/patient-visit-contract-spec-2026-04-06.md)

Contract rules:

- active visits are returned as a list, not a singleton
- the frontend should not filter or reconstruct visit details
- visit detail should come from a dedicated patient endpoint

### What must be true today

- patient can open records and see visit history
- patient can identify active visits separately from past visits
- each active visit shows current stage
- each active visit exposes orders summary:
  - lab
  - imaging
  - medication
- patient can access results and record outputs where available:
  - prescriptions
  - lab results
  - referral summaries
  - visit summaries

### Required implementation direction

- do not leave visit context split awkwardly between Home and Records
- use Home for summary and next step
- use Records for history, details, and structured outputs
- do not rely on frontend filtering to reconstruct one visit from document feeds
- backend should return patient-ready visit detail payloads

### Acceptance criteria

- patient can see past visits in a recent-first structure
- patient can see zero, one, or multiple clearly separated active visits
- orders are visible in a readable grouped format
- results and outputs are visible or clearly marked unavailable
- no dead-end “View” affordances without actual data behind them

## Priority 2: Facility finder

### Goal

Patient can find care locations and move directly into booking.

### Current implementation base

- [src/screens/FacilityFinderScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/FacilityFinderScreen.js)
- [src/screens/CareHubScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/CareHubScreen.js)
- [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js)
- [src/App.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/App.js)

### What must be true today

- patient can open Facility Finder from Care and Home-related care actions
- patient can browse facilities cleanly
- patient can understand enough facility information to act
- patient can move from facility to appointment booking without friction

### Required implementation direction

- facility cards must not be decorative only
- facility information must prioritize action:
  - name
  - type
  - location
  - availability signals if present
  - booking action
- maintain shallow navigation:
  - Care -> Facilities -> Book appointment

### Acceptance criteria

- Facility Finder is reachable through the patient flow
- booking handoff works from selected facility
- empty and no-results states are clear
- facility list is easy to scan and not overloaded

## Priority 3: UI implementation rules

### Goal

Use `docs/UI design` as the visual reference, but implement the app in a maintainable, scalable way.

### Reference design source

- `docs/UI design/home`
- `docs/UI design/login`
- `docs/UI design/registration`
- `docs/UI design/records`
- `docs/UI design/appointments`
- `docs/UI design/appointment_confirmed`
- `docs/UI design/care`
- `docs/UI design/check_symptoms`
- `docs/UI design/connect_device`
- `docs/UI design/track_bp`
- `docs/UI design/blood_sugar_trends`
- `docs/UI design/profile`
- `docs/UI design/manage_consent`
- `docs/UI design/add_caregiver`

### Required implementation rule

Use the design language, layout intent, and content hierarchy from the HTML designs.

Do not:

- copy static inline colors into many screens
- hardcode one-off spacing values everywhere
- create one-use-only UI primitives for each screen
- build brittle components that only match one HTML file

### Required implementation approach

- extract shared colors into theme tokens
- extract reusable card/button/section/header patterns
- create scalable UI primitives where design repeats
- keep screen-specific composition in the screen files
- keep style direction from the designs, not literal hardcoded duplication

### Specific expectations

- if multiple screens use similar hero cards, create a reusable pattern
- if multiple screens use similar status pills, create a reusable status component
- if multiple screens use similar section blocks, create a reusable section shell
- if chart screens are implemented, chart wrappers should be reusable by metric

### Acceptance criteria

- screens visually follow the direction in `docs/UI design`
- styling remains token-based and reusable
- components are not locked to a single screen use case
- no explosion of hardcoded colors and ad hoc layout constants

## Today’s target deliverables

By end of day, we want these user outcomes working:

1. A new patient with no facility can register and sign in.
2. A patient can open the app and see active visit summary.
3. A patient can open records and see visit history plus visit-linked outputs.
4. A patient can use Facility Finder and move into appointment booking.
5. The UI direction is aligned with `docs/UI design` without being implemented as brittle screen-specific styling.

## Suggested execution order

1. Finish registration and login flow.
2. Verify post-registration patient session and profile fetch.
3. Finish visit history and active visit detail presentation.
4. Finish Facility Finder to booking handoff.
5. Refactor or align UI styling to design references where needed.

## Working notes for implementation

### Registration and login

- verify patient registration does not depend on facility linkage
- remove or avoid any logic that assumes facility membership at account creation
- implement first-time OTP verification plus password creation
- implement later patient password sign-in using device-fetched phone number
- keep clinician password flow separate from patient auth flow

### Visits

- if current records UI does not clearly express visit history, prioritize structure over decoration
- do not bury active visit detail under too many taps
- if visit details deserve their own screen, create one rather than overloading records cards

### Facility Finder

- keep booking CTA visible
- keep facility information concise
- avoid too many filters if they are not essential today

### UI scaling

- preserve design hierarchy from the HTML mocks
- implement patterns, not screenshots

## Definition of done for today

Today is successful if:

- patient registration works without facility membership
- patient auth flow is stable
- visit history and active visit are understandable in the UI
- orders/results are accessible in the patient flow
- facility finder is usable and connected to booking
- the implementation direction matches the design system intent rather than hardcoded static mock styling

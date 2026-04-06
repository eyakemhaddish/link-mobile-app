# Patient Portal MVP and UI Improvement Plan

## Goal

Before adding advanced reminders, tracking, or device integration, the app needs to satisfy the core jobs of a patient portal.

This document defines:

- what a patient portal must do at MVP level
- where the current app already meets that need
- where the current app falls short
- what to build first
- what UI changes are needed so the app feels like a usable patient portal rather than a collection of disconnected screens

## What a patient portal must do

At minimum, a patient portal should help a patient do these things reliably:

1. Sign in and manage their account safely.
2. See their health information and visit history.
3. Understand what is happening now and what to do next.
4. Book and manage appointments.
5. Share or control access to their records.
6. Reach the right care path quickly.
7. Receive clear follow-up actions and reminders.

If those jobs are weak, the portal is not ready for expansion features.

## Current app assessment

### What already exists

The patient app already has meaningful pieces:

- Sign-in and patient onboarding:
  - [src/screens/LoginScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/LoginScreen.js)
- Home dashboard with active visit status:
  - [src/screens/HomeScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/HomeScreen.js)
- Appointment booking and listing:
  - [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js)
- Personal records and document upload surface:
  - [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js)
- Consent management:
  - [src/screens/PatientConsentScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientConsentScreen.js)
- Symptom-checker flow and symptom logging:
  - [src/screens/SymptomCheckerScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerScreen.js)
  - [src/screens/SymptomCheckerConversationalScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerConversationalScreen.js)
- Facility discovery:
  - [src/screens/FacilityFinderScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/FacilityFinderScreen.js)
- Profile editing:
  - [src/screens/ProfileScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/ProfileScreen.js)

### Where the core portal purpose is still weak

The current app is not yet strong enough in these areas:

#### 1. The home experience is not centered on patient next actions

The current home screen has some useful live-visit context, but it still behaves more like a concept board than a patient command center.

Problems in [src/screens/HomeScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/HomeScreen.js):

- "Find care" and "Health feed" appear actionable but are dead-end cards.
- "See all" is visual only.
- Stats like `Records`, `Tasks`, and `Today` are not clearly tied to patient actions.
- There is no strong "what should I do next?" section.
- No upcoming appointment, pending consent, or reminder block.

#### 2. The navigation prioritization is not MVP-focused

Current tabs in [src/navigation/MainTabs.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/navigation/MainTabs.js):

- Home
- Symptoms
- Facilities
- Feed
- Profile

This is not the best structure for a patient portal MVP.

Problems:

- `Health Feed` gets a top-level tab even though it is not core to portal value.
- `Records` and `Appointments` are more important than `Feed`, but they are hidden below the home screen.
- `Profile` as a top-level tab is less important than core care actions for most patients.

#### 3. Records are present, but the patient record story is not complete

The record surface exists, but it is not yet a complete patient health record experience.

Problems:

- No strong summary view of recent visits, diagnoses, prescriptions, and labs in one place.
- Document upload is still a weak/manual flow rather than a polished patient record action.
- No export/share workflow is visible as a primary capability.
- No clear "visit detail" drill-down path from home into records history.

#### 4. Appointments exist, but the patient journey around them is thin

Appointments are implemented, but the experience still needs:

- clear upcoming appointment emphasis
- status-aware actions
- pre-visit preparation guidance
- post-booking confirmation visibility
- reminder readiness

#### 5. Health Feed is oversized for the current maturity level

The feed currently has more product weight than it should.

Issues:

- It occupies a main tab.
- It is not core to the minimum patient portal job set.
- It risks distracting from records, appointments, consent, and care navigation.

#### 6. The app still lacks a cohesive patient summary

A patient should be able to open the app and immediately understand:

- do I have an active visit
- what is my next appointment
- do I have anything pending
- what changed since my last visit
- where can I get care quickly

That summary is still incomplete today.

## MVP decision

The patient portal MVP should focus on 5 product pillars only:

1. Access and identity
2. Records and visit history
3. Appointments and next steps
4. Care navigation
5. Consent and trust

Everything else should be secondary until these are solid.

## Patient Portal MVP scope

### Pillar 1: Access and identity

Must-have:

- patient OTP login
- account setup
- profile editing
- safe sign-out
- basic app lock support

Status:

- Mostly present

Remaining work:

- polish role/profile fetch behavior
- remove demo-only patient confusion in production mode
- improve profile clarity and formatting

### Pillar 2: Records and visit history

Must-have:

- recent visits
- visit details
- prescriptions
- lab results
- uploaded documents
- one obvious place to find them

Status:

- Partially present

Remaining work:

- build a stronger records summary landing view
- connect home screen to recent visits and records directly
- improve visit detail discoverability
- promote recent documents and synced records more clearly

### Pillar 3: Appointments and next steps

Must-have:

- book appointment
- see upcoming appointments
- see appointment status
- see what to do before the appointment
- see reminders or pending actions

Status:

- Partially present

Remaining work:

- surface upcoming appointment on home
- show next-action cards
- support appointment states more clearly
- prepare for reminders integration

### Pillar 4: Care navigation

Must-have:

- symptom checker
- facility discovery
- route to appointment booking
- route to current care status

Status:

- Mostly present

Remaining work:

- make care actions more direct from home
- tighten handoff between symptom checker, facilities, and appointments
- reduce duplicate or indirect pathways

### Pillar 5: Consent and trust

Must-have:

- understand what data is shared
- manage consent
- see trustworthy profile/account state

Status:

- Present but not prominent enough

Remaining work:

- surface consent status on home or records contextually
- make record-sharing actions feel more intentional

## Recommended MVP release plan

### MVP Release A: patient portal essentials

This should happen before advanced reminder/tracking work.

Build:

- stronger home dashboard
- better records landing experience
- upcoming appointment summary
- clearer navigation structure
- removal of dead-end home actions
- better patient next-step guidance

### MVP Release B: appointments and records hardening

Build:

- appointment state polish
- visit detail entry points
- document/record organization improvements
- export/share plan for records

### MVP Release C: reminders foundation

Only after the portal’s basic jobs are working clearly:

- local notifications
- medication reminders
- appointment reminders

## UI improvement plan

The current UI is not bad in isolated screens, but the overall product hierarchy is weak. The app needs to feel more purposeful and patient-centered.

### 1. Rework information hierarchy

The app should answer these questions in the first screenful:

- what is happening now
- what do I need to do next
- where are my records
- how do I get care fast

Recommended new home layout:

- top summary card
  - active visit or no active visit
  - next appointment
  - next recommended action
- quick actions row
  - Check symptoms
  - Book appointment
  - View records
  - Find care
- recent health activity
  - last visit
  - recent document
  - recent symptom check
- trust block
  - consent status
  - profile completeness

### 2. Remove or demote non-core UI

For MVP:

- remove `Health Feed` from the main tab bar
- move feed into a secondary area or keep it behind home content cards
- remove dead visual actions that do not navigate anywhere

### 3. Change tab structure

Recommended MVP tab structure:

- Home
- Records
- Appointments
- Care
- Profile

Where:

- `Care` contains symptom checker and facility discovery
- `Records` becomes a first-class destination
- `Appointments` becomes a first-class destination
- `Feed` is removed from primary navigation

This is a better match for the real patient jobs.

### 4. Improve visual consistency

Current screens feel like they come from slightly different product moments.

Needs:

- consistent spacing scale
- more consistent card actions
- fewer decorative blocks that do not carry real patient value
- stronger section labels tied to actions
- clearer empty states

### 5. Improve language and labels

Replace vague labels with patient-action labels.

Examples:

- `Records` instead of `Overview` cards with unclear stats
- `Upcoming appointment` instead of generic service cards
- `What to do next` instead of unlabeled utility cards
- `Get care now` or `Check symptoms` instead of passive discovery phrasing

### 6. Strengthen empty states

Important patient empty states should guide action:

- no active visit
- no appointments
- no records yet
- no linked facility
- no consent history

Each should include one clear CTA.

### 7. Add home-driven continuity

The app should retain a stronger sense of continuity between visits.

Home should eventually show:

- last appointment outcome
- pending follow-up
- recent documents
- next recommended health action

## Specific screen recommendations

### HomeScreen

Change [src/screens/HomeScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/HomeScreen.js):

- replace dead cards with real navigations
- remove `See all` unless it navigates
- add upcoming appointment summary
- add recent records preview
- add a `What to do next` section
- keep active visit banner, but make it the first card with clearer urgency styling

### MainTabs

Change [src/navigation/MainTabs.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/navigation/MainTabs.js):

- replace `Feed` tab with `Records` or `Appointments`
- merge symptom checker and facility finder under a `Care` destination if needed

### PatientHealthRecordsScreen

Strengthen [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js):

- add sections for visits, labs, prescriptions, and uploads
- improve filtering and sorting
- make empty state more confidence-building
- add obvious share/export direction if backend supports it

### PatientAppointmentsScreen

Strengthen [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js):

- separate upcoming vs past
- add stronger status chips
- show actionable preparation steps
- support cancellation/reschedule later if backend permits

### ProfileScreen

Improve [src/screens/ProfileScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/ProfileScreen.js):

- show identity and contact info more clearly
- include linked phone and emergency contacts cleanly
- eventually include notification preferences and language preferences

## Design principles for the next UI pass

Use these principles when changing the UI:

- patient action first, decoration second
- one clear CTA per state
- show next step, not just data
- keep trust-sensitive actions explicit
- make records and appointments primary, not hidden
- keep the design calm, clinical, and reliable

## What should not block MVP

These are valuable, but should not block the patient portal MVP:

- advanced health feed/community features
- adaptive reminders
- device integrations
- caregiver features
- streaks and habitification
- deep preventive challenge programs

## Recommended next step

The best next implementation step is not advanced reminders yet.

It is:

1. Rework navigation and home information hierarchy.
2. Promote records and appointments to first-class destinations.
3. Remove dead-end actions.
4. Add a real patient summary and next-step experience.
5. Then layer in reminders on top of that stronger portal foundation.

This gives the app a clearer MVP identity and makes later reminder/tracking features land in the right product structure.

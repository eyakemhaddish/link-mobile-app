# Ethiopia Patient Portal UI/UX Flow Design Document

## Audience

This document is for the UI/UX design team.

It defines the full intended patient experience for Link as a patient portal for Ethiopian users, especially:

- non-technical users
- low digital literacy users
- users with intermittent internet
- users who may be more comfortable with Amharic than English
- users who need very clear next steps and low-friction navigation

This document builds on:

- [ProjectOverview.md](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/docs/ProjectOverview.md)
- [patient-portal-mvp-and-ui-plan-2026-04-03.md](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/docs/patient-portal-mvp-and-ui-plan-2026-04-03.md)
- [mobile-reminders-tracking-improvement-plan-2026-04-03.md](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/docs/mobile-reminders-tracking-improvement-plan-2026-04-03.md)

It should also be read against the current implemented patient app surfaces:

- [src/screens/LoginScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/LoginScreen.js)
- [src/screens/HomeScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/HomeScreen.js)
- [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js)
- [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js)
- [src/screens/SymptomCheckerScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerScreen.js)
- [src/screens/SymptomCheckerConversationalScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerConversationalScreen.js)
- [src/screens/FacilityFinderScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/FacilityFinderScreen.js)
- [src/screens/PatientConsentScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientConsentScreen.js)
- [src/screens/ProfileScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/ProfileScreen.js)
- [src/screens/CareHubScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/CareHubScreen.js)
- [src/navigation/MainTabs.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/navigation/MainTabs.js)

## Current implemented foundation

This design is not starting from zero. The team should preserve and refine the product foundations that already exist.

### Already implemented in the current app

- patient OTP login and basic registration flow
- Home as the patient landing experience
- patient records screen with synced and uploaded documents
- appointment list and booking flow
- symptom checker and conversational care handoff
- facility discovery
- consent management
- profile editing
- care hub shell
- patient-first 5-tab structure:
  - Home
  - Records
  - Appointments
  - Care
  - Profile

### What this means for design

The design team should:

- keep the current core product areas
- redesign their hierarchy and interaction quality where needed
- extend them into a complete experience
- avoid inventing a totally different navigation model unless there is a very strong reason

### Current-to-target mapping

Use this mapping when designing:

- current patient OTP-only onboarding becomes:
  - first-time OTP verification
  - registration with password creation
  - later password sign-in with prefilled phone number
- current `Home` becomes the stronger patient command center
- current `PatientHealthRecords` becomes the main records destination with charts and tracking summaries
- current `PatientAppointments` becomes the main appointment and reminder destination
- current `CareHub`, `SymptomChecker`, `SymptomCheckerConversational`, and `FacilityFinder` form one care-navigation system
- current `Profile` becomes identity plus reminder, device, caregiver, and settings management
- current `PatientConsent` remains part of trust and record-sharing flow

## Product framing

The app should feel like:

- my health home
- my next-step guide
- my records folder
- my appointment helper
- my reminder helper
- my place to track health and connect simple home devices
- my safe connection to care

It should not feel like:

- a hospital dashboard
- a technical records system
- a Bluetooth utility app
- a feature-heavy wellness app
- a maze of settings

## Core user promise

When a patient opens Link, they should quickly understand:

- what is happening with their care right now
- what they need to do next
- where their records are
- what medicine or appointment needs attention
- how their daily health is trending
- how to get help fast
- who can access their data

## Target Ethiopian user realities

The design must assume:

- some users are first-time smartphone users
- some users are older and need larger tap targets
- some users may read slowly
- some users may switch between Amharic and English
- many users will prefer simple, direct language over healthcare jargon
- users may not trust digital systems immediately and need reassurance
- internet may be slow or unavailable
- reminders must still make sense offline
- users may share phones with family members
- many device users will own common home devices like:
  - blood pressure monitors
  - glucometers
  - weighing scales

## UX principles

### 1. One clear next step

Each important screen should answer:

- what is this screen for
- what can I do here
- what is the main next action

### 2. Low cognitive load

Avoid screens that ask users to scan too many cards, chips, tabs, and secondary actions at once.

The app must never expose all health controls at once on the same screen.

### 3. Progressive disclosure

The design should reveal complexity gradually.

Rules:

- first show the main action
- then show the supporting action
- only then show advanced settings

Examples:

- first show `Take medicine`
- then show `Snooze`
- only in details show `Edit schedule`

- first show `Track blood pressure`
- then show `See chart`
- only in details show `Connect device`

- first show `Upcoming appointment`
- then show `Book` or `Call clinic`
- only in details show reminder and caregiver settings

### 4. Action-first language

Use labels like:

- Check symptoms
- Book appointment
- Open records
- Find care
- Track blood pressure
- Track blood sugar
- Connect device
- Share records
- Call clinic

Avoid vague labels like:

- Overview
- Insights
- Explore
- Discover
- Activity

### 5. Trust and reassurance

The product should repeatedly communicate:

- your records are yours
- you control sharing
- your data is protected
- your reminders can still work with weak internet
- manual tracking still works even without a connected device

### 6. Calm, respectful design

The visual language should feel:

- calm
- clear
- trustworthy
- warm but not playful
- modern but not flashy

Avoid:

- overly decorative layouts
- too many competing bright colors
- tiny status labels
- dense information blocks

## Main menu and information architecture

The main patient navigation should be:

1. Home
2. Records
3. Appointments
4. Care
5. Profile

This menu should stay stable even as the product becomes complete.

The design team should not create a new top-level tab for every new feature.

### Home

Purpose:

- show current care status
- show next steps
- show today’s reminders
- show quick tracking entry
- point to the most important patient actions

Current implementation base:

- [src/screens/HomeScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/HomeScreen.js)

### Records

Purpose:

- show visits
- show documents
- show prescriptions, labs, and summaries
- show charts for important tracked health data
- support sharing/export

Current implementation base:

- [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js)

### Appointments

Purpose:

- book care
- manage upcoming appointments
- show status and preparation
- show appointment reminders

Current implementation base:

- [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js)

### Care

Purpose:

- symptom checker
- facility finder
- care-seeking guidance
- follow-up symptom and check-in flows

Current implementation base:

- [src/screens/CareHubScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/CareHubScreen.js)
- [src/screens/SymptomCheckerScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerScreen.js)
- [src/screens/SymptomCheckerConversationalScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/SymptomCheckerConversationalScreen.js)
- [src/screens/FacilityFinderScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/FacilityFinderScreen.js)

### Profile

Purpose:

- personal details
- emergency contact
- language
- reminders and notification preferences
- caregiver settings
- connected devices
- sign out

Current implementation base:

- [src/screens/ProfileScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/ProfileScreen.js)

## Menuization strategy

This product must use menuization to reduce confusion, but menu depth must stay shallow.

### Rule

The user should rarely go deeper than:

1. tab
2. section screen
3. detail screen

Avoid rabbit holes like:

- tab -> section -> subsection -> settings -> subsettings -> details

### What belongs directly in tabs

- the patient’s daily jobs

### What belongs in secondary menus

- advanced settings
- device management
- caregiver permissions
- detailed reminder editing

### What belongs inside cards or bottom sheets

- quick actions
- simple confirmations
- small choice lists

### What should not become standalone navigation unless absolutely necessary

- a separate reminder app area
- a separate Bluetooth/device app area
- multiple separate tracking tabs per metric

## End-to-end patient flow

## Flow 1: First-time patient onboarding

### Goal

Allow the user to get into the app with minimal friction and enough trust.

### Steps

1. Open app
2. See simple explanation of what Link is
3. Enter phone number
4. Receive OTP
5. Verify OTP
6. If new patient, complete quick registration
7. Create password
8. Land on Home

Current implementation base:

- [src/screens/LoginScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/LoginScreen.js)

### UI/UX requirements

- OTP flow must be visually simple and linear
- one primary action per step
- form copy should be short and plain
- password creation should happen only after OTP verification
- password setup should be its own clear step, not buried in a dense form
- emergency contact fields should not feel mandatory unless they are
- show reassurance:
  - "You control your records"
  - "You can book care and keep your records here"
  - "You can track your health here even without a device"

### Design notes

- avoid large paragraphs during onboarding
- use progress indicators for multi-step registration
- prefer full-width buttons
- use examples in local phone formatting
- do not introduce device connection during initial onboarding

## Flow 1b: Returning patient sign-in

### Goal

Make repeat sign-in faster and simpler than first-time registration.

### Steps

1. Open app
2. App reads stored device phone number
3. Show phone number prefilled and not editable
4. Ask only for password
5. Sign in
6. Land on Home

### UI/UX requirements

- returning sign-in should be simpler than registration
- phone number should be visible for trust, but not editable in the main sign-in view
- if patient needs to change number, use a separate `Use another phone number` path
- password screen must be simple and uncluttered

### Copy direction

Prefer:

- "Sign in to your account"
- "Phone number on this device"
- "Enter your password"
- "Use another phone number"

Avoid:

- technical device-account phrasing
- long explanations on the sign-in screen

## Flow 2: Returning patient opening the app

### Goal

The user should understand their status within seconds.

### Home screen must show

1. Current care status
2. Next appointment or no appointment
3. Main quick actions
4. Today’s reminder highlight
5. One quick tracking highlight
6. Record/consent summary

### Home screen must not show all at once

Home must not become a control center with too many cards.

Maximum default Home modules:

1. current status
2. next action
3. quick actions
4. upcoming appointment
5. one reminder highlight
6. one tracking highlight
7. records/consent summary

Anything beyond that should go behind:

- `See details`
- a secondary screen
- a detail page inside the tab

### First screen questions Home must answer

- Do I have an active visit?
- Do I have an appointment coming up?
- What should I do next?
- Do I have medicine to take now?
- Do I need to log today’s reading?
- Where are my records?
- How do I get care now?

### Home content order

1. Primary status card
2. Quick actions
3. Upcoming appointment block
4. Reminder block
5. Tracking block
6. Records and consent block

### Home should never feel like

- a news feed
- a marketing page
- a dashboard of abstract metrics
- a medical control panel

## Flow 3: Patient needs care now

### Goal

Move the user from uncertainty to the right care path quickly.

### Entry points

- Home: Check symptoms
- Care tab: Check symptoms
- reminder or tracking escalation

### Steps

1. User taps Check symptoms
2. Guided flow starts
3. User describes symptoms in simple language
4. App responds with:
  - urgency
  - next steps
  - clear actions
5. User can:
  - find a clinic
  - book appointment
  - open records

### UI/UX rules

- avoid overly clinical terminology
- keep one-question-at-a-time where possible
- use large action buttons after advice
- urgency color coding must be strong but not panic-inducing
- always give a clear next step, not just an explanation

## Flow 4: Patient wants to book care

### Goal

The patient should move from intent to confirmed request with low friction.

### Entry points

- Home quick action
- Care tab
- symptom checker handoff
- Facility Finder

### Steps

1. User enters Appointments
2. Sees upcoming and past states clearly
3. Taps Book appointment
4. Selects facility
5. Selects preferred date and time
6. Enters reason
7. Sends request
8. Sees confirmation and what happens next
9. Sees reminder option only after booking confirmation

Current implementation base:

- [src/screens/PatientAppointmentsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientAppointmentsScreen.js)

### Required appointment states

- no appointments
- pending
- confirmed
- declined
- cancelled
- completed

### UI/UX requirements

- show upcoming appointments first
- separate upcoming from past
- status chips must be very easy to scan
- include facility phone if useful
- after booking, show one clear summary card
- travel-time suggestion should appear as a lightweight helper, not a planner

## Flow 5: Patient wants to see records

### Goal

Records should feel like a personal health folder, not a database table.

### Entry points

- Home quick action
- Records tab
- symptom checker handoff
- appointment follow-up context

### Records landing structure

Records should have clear sections:

1. Recent visits
2. Prescriptions
3. Lab results
4. Visit summaries
5. Uploaded documents
6. Vaccination records
7. Health tracking charts

Current implementation base:

- [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js)

### Default record tasks

- read latest visit information
- find prescription or lab
- upload a document
- see charts for daily blood pressure, blood sugar, and weight
- share/export

### UI/UX requirements

- use plain section labels
- use document type chips and dates clearly
- prioritize recency
- use strong empty states with explanation
- make synced records feel trustworthy and distinct from manual uploads
- charts should be simple:
  - latest reading
  - short trend
  - normal-range band where useful

### Important design behavior

A patient should not have to search too early.

For most users:

- recent and relevant records should be visible first
- search and filters should support, not replace, structure

## Flow 6: Patient wants to understand privacy and consent

### Goal

Consent must feel understandable and controlled, not hidden.

### Entry points

- Home records/consent block
- Records sharing actions
- Consent section

Current implementation base:

- [src/screens/PatientConsentScreen.js](C:/Users/hp/Desktop/Projects/Link/link-mobile-app/src/screens/PatientConsentScreen.js)

### What user must understand

- who can access records
- what type of access is granted
- how to revoke access
- that consent is in the patient’s control

### UI/UX rules

- use examples, not legal language
- explain choices in plain language
- show active consent clearly
- use confirmation dialogs before sensitive actions

## Flow 7: Patient profile and trust

### Goal

Profile should support trust, not just account editing.

### Core profile content

- full name
- phone number
- date of birth
- gender if collected
- emergency contact
- preferred language
- sign out

Related auth utilities in Profile or account support:

- use another phone number
- reset password
- account recovery

### Settings areas inside Profile

- reminders and notifications
- caregiver settings
- connected devices

### UI/UX rules

- show current values clearly
- keep editing simple
- avoid making Profile the center of the product
- use Profile as a support area, not the primary workflow
- settings groups must be clearly named and limited

## Flow 8: Medication reminders

### Goal

Help the patient remember medicines without making them manage a complex scheduler manually.

### Entry points

- Home reminder highlight
- Appointments follow-up
- Profile reminder settings
- medicine details

Placement using existing product areas:

- Home for the next reminder
- Appointments for visit-linked reminders
- Profile for settings

### Reminder behavior

The user should be able to:

1. See the next medication reminder
2. Mark medicine as taken
3. Snooze
4. Skip if necessary
5. Open simple medicine details

### UI/UX rules

- reminder cards should be simple and immediate
- show one medicine task at a time
- use daypart icons where useful
- avoid exposing complex recurrence settings by default
- advanced schedule editing belongs in a secondary screen

### Recommended default reminder card

Show:

- medicine name
- when to take it
- small instruction like `Take with food`
- actions:
  - Taken
  - Snooze

Move to details:

- dose history
- full schedule
- side-effect check-ins
- caregiver escalation settings

## Flow 9: Daily health tracking

### Goal

Allow patients to log important health information simply and see clear charts.

### Tracking items

- blood pressure
- blood sugar
- weight
- pain
- symptoms
- sleep
- mood

### Entry points

- Home tracking highlight
- Records charts section
- reminder/check-in prompts

Placement using existing product areas:

- Home for quick logging entry
- Records for history and charts

### Simple tracking flow

1. User sees a prompt like `Track blood pressure`
2. Taps into a simple entry screen
3. Enters reading manually or imports from connected device
4. Sees confirmation
5. Can view chart and history

### Required chart behavior

Charts should exist for the main home-logged measures:

- daily blood pressure
- daily blood sugar
- daily weight

Charts should show:

- latest reading
- last 7 or 30 days
- simple trend direction
- alert if readings are higher or lower than usual

### UI/UX rules

- one metric per quick-entry flow
- avoid forcing users into multi-metric forms
- keep charts simple
- default to latest reading plus trend, not dense analytics

## Flow 10: Device connection

### Goal

Support common home devices without making device setup a barrier to care.

### Device types to support in the product flow

- blood pressure monitor
- glucometer
- weighing scale

### Entry points

- Profile
- Tracking setup
- tracking detail screens

Placement using existing product areas:

- Profile as the main entry
- Records/tracking detail screens as the secondary entry

### Simple device connection flow

1. User taps `Connect device`
2. Chooses device type
3. Sees simple instructions
4. Connects device
5. Confirms readings are coming in
6. Returns to tracking flow

### UI/UX rules

- device setup must be optional
- do not present device connection during initial onboarding
- do not force device setup before manual tracking works
- always allow `Continue without device`
- never present technical Bluetooth jargon unless absolutely necessary

### Device detail screens should show

- connected status
- last sync
- device type
- use for blood pressure, blood sugar, or weight
- remove or reconnect

### Device screens should not show

- advanced technical controls
- protocol names
- engineering/debug terms

## Flow 11: Caregiver support

### Goal

Allow help from family or caregivers without reducing patient control.

### Entry points

- Profile settings
- reminder settings
- safety settings

Placement using existing product areas:

- Profile as the main entry
- reminder and safety detail screens as the secondary entry

### Caregiver setup flow

1. User taps `Add caregiver`
2. Sees explanation of what caregiver access means
3. Enters caregiver details
4. Selects what caregiver can be notified about
5. Confirms sharing

### UI/UX rules

- caregiver setup must be explicit and consent-driven
- use plain language
- break the flow into small steps
- never combine caregiver permissions with general profile editing
- caregiver controls should be grouped under one secondary area

## Complete product navigation without overload

The main tab bar should remain:

1. Home
2. Records
3. Appointments
4. Care
5. Profile

Additional capabilities should live inside these areas:

- reminders inside Home, Appointments, and Profile settings
- tracking inside Home and Records
- devices inside Profile and tracking setup
- caregivers inside Profile settings

Do not add new top-level tabs for every new feature.

## Control density rules for designers

These rules are mandatory.

### Per screen

- one primary CTA
- at most two secondary actions in immediate view
- advanced settings moved to secondary screens

### Per card

- show one status
- show one main action
- avoid multiple small chips unless they are truly necessary

### Per form

- use step-by-step flows for complex setup
- do not present long technical forms on a single screen

### Per Home screen

- no more than 6 to 7 content blocks by default
- if there are more, personalize and hide low-priority modules behind `See more`

## Screen-by-screen UI direction

## Login and registration

### Visual priority

1. first-time or returning path clarity
2. phone trust and identity
3. OTP or password entry
4. one clear primary action

### Components

- simple split between:
  - first-time registration path
  - returning password sign-in path
- phone number field for first-time onboarding
- prefilled phone display for returning sign-in
- OTP entry
- password creation
- password entry

### Preserve from current app

- OTP-first patient acquisition
- registration after patient-not-found

### Improve from current app

- add password creation after OTP verification
- make returning sign-in a password flow
- show phone number from device as prefilled and non-editable
- provide a separate escape path for switching numbers

## Home

### Visual priority

1. status
2. next action
3. care actions
4. appointment summary
5. reminder highlight
6. tracking highlight
7. records/consent summary

### Components

- large top summary card
- large, easy-tap quick action buttons
- one reminder highlight card
- one tracking highlight card
- small number of high-value summary cards

Preserve from current app:

- active visit visibility
- direct care actions

Improve from current app:

- stronger hierarchy
- fewer decorative metrics
- better continuity between records, appointments, and care

### Not allowed on Home

- full medication dashboard
- full chart gallery
- device management panels
- caregiver permission panels

## Records

### Visual priority

1. recent important records
2. clear categories
3. charts for BP, glucose, weight
4. document actions

### Components

- segmented record sections
- chips for type
- date and provider prominence
- trusted-source badges for synced records
- simple chart cards

Preserve from current app:

- synced/manual distinction
- upload action
- record type labels

Improve from current app:

- stronger sectioning
- better recent-first browsing
- integrate charts into the same records mental model

## Appointments

### Visual priority

1. upcoming appointment
2. book appointment
3. appointment status
4. facility contact
5. reminder state

### Components

- prominent upcoming appointment card
- clear status chips
- fixed bottom CTA or FAB for booking
- reminder toggle after confirmation
- preparation checklist where useful

Preserve from current app:

- booking flow
- facility selection
- status chips

Improve from current app:

- clearer upcoming vs past separation
- better post-booking guidance
- integrate reminders into the appointment experience

## Care

### Visual priority

1. symptom entry
2. urgency understanding
3. route to care

### Components

- symptom checker hero action
- secondary card for facility discovery
- handoff buttons after any advice

Preserve from current app:

- conversational symptom handoff
- facility discovery
- book appointment handoff

Improve from current app:

- unify all care actions under one stronger care journey
- reduce duplicated navigation paths

## Profile

### Visual priority

1. identity
2. emergency contact
3. reminders
4. connected devices
5. caregiver settings
6. sign out

### Components

- editable fields
- grouped settings sections
- clear entry points for reminders, devices, and caregivers

Preserve from current app:

- editable patient details
- emergency contact management

Improve from current app:

- clearer grouping
- add reminders, device, and caregiver settings in one controlled structure

## Language and localization

The app should be designed for multilingual support from the start.

Primary target languages:

- Amharic
- English

Design implications:

- allow text expansion
- avoid very tight button widths
- test for long labels
- keep sentences short

## Copywriting rules

- use short sentences
- use direct verbs
- explain one thing at a time
- avoid hidden assumptions
- avoid abbreviations unless very common

## Low-literacy support patterns

- icons should reinforce, not replace, text
- use examples in forms
- use consistent button labels across screens
- use confirmation summaries after important actions
- use clear color plus label combinations for statuses

## Accessibility and interaction rules

### Required interaction rules

- large touch targets
- simple tap interactions over nested menus
- clear contrast
- readable font sizes
- low clutter
- consistent bottom navigation
- confirmation for sensitive actions

### Important accessibility patterns

- empty states must include one action
- errors must explain what to do next
- forms must highlight the missing field clearly
- avoid hidden gestures as primary actions

## Offline and low-connectivity UX

This is critical for the target context.

### UX expectations

- app should not feel broken when connection is weak
- local data should still be visible where possible
- actions waiting for sync should be explained simply
- reminders should still feel dependable
- manual tracking should still work without device sync

### Recommended system messages

Prefer:

- "Saved on this phone. Will sync when internet returns."
- "Some live clinic information may be delayed."
- "You can still log your blood pressure manually."

Avoid:

- technical sync failures with internal language
- raw server error messages

## Design direction summary

The UI team should design the patient portal around this experience:

- simple to enter
- easy to understand
- obvious next actions
- strong trust cues
- grounded in the product areas already implemented
- reminders and tracking integrated into the same product flow
- charts visible where patients expect them
- device connection available but never forced
- minimal friction
- calm and respectful visual design
- navigation based on patient jobs, not feature novelty

## Design team deliverables needed next

1. Full patient navigation map
2. Home screen redesign
3. Records information architecture including charts
4. Appointments full state design
5. Care hub and symptom handoff design
6. Consent UX refinement
7. Reminder interaction model
8. Tracking entry and chart model for BP, glucose, and weight
9. Device connection setup flow for common home devices
10. Caregiver setup and permission flow
11. Low-connectivity and error-state design language
12. Bilingual copy-aware layout rules

## Immediate design priority

Design the full patient journey in one coherent product:

1. Login and onboarding
2. Home
3. Records
4. Appointments
5. Care
6. Profile
7. Reminders
8. Tracking and charts
9. Device connection
10. Caregiver support

The result should be a complete but intuitive patient portal for non-technical Ethiopian users, with shallow menus, clear actions, and no rabbit-hole navigation.

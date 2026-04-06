# Link Mobile App Production Audit

Date: 2026-03-31

## Scope

This audit compares the mobile app in `link-mobile-app` against the backend contract documented in `swagger.json`, with the backend migration target set to `http://localhost:5000`.

## Current Environment State

- Added `.env` with:
  - `EXPO_PUBLIC_API_BASE_URL=http://localhost:5000`
- The app is not yet fully aligned to the documented backend because request construction still assumes `/api`, while `swagger.json` is mostly `/api/v1`.

## Architecture Summary

- App shell and role routing:
  - `patient` flow via [src/navigation/MainTabs.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/navigation/MainTabs.js)
  - `hew` flow via [src/navigation/HEWNavigator.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/navigation/HEWNavigator.js)
  - `clinician/provider` flow via [src/navigation/ClinicianNavigator.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/navigation/ClinicianNavigator.js)
- Shared providers are composed in [src/App.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/App.js).
- API calls are centralized through [src/lib/api.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/lib/api.js) and service modules in [src/services](C:/Users/hp/desktop/projects/link/link-mobile-app/src/services).
- Clinician functionality is largely local-first via SQLite repos and sync:
  - [src/repositories/patientRepo.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/repositories/patientRepo.js)
  - [src/repositories/visitRepo.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/repositories/visitRepo.js)
  - [src/services/syncService.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/services/syncService.js)

## Top Production Blockers

1. API versioning mismatch
- The app currently builds URLs around `/api` in [src/lib/api.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/lib/api.js).
- `swagger.json` documents the backend mostly under `/api/v1`.
- A `.env` change alone does not fix this.

2. Mock and demo behavior still present
- Web API calls are mocked in [src/lib/api.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/lib/api.js).
- Web auth uses a stub profile in [src/context/AuthContext.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/context/AuthContext.js).
- Demo PIN login remains in [src/screens/LoginScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/LoginScreen.js).

3. Contract drift in auth and search
- The app uses `/auth/profile` and `/auth/user`.
- Swagger already contains related identity routes, but not under those exact client paths:
  - `/api/v1/patient-auth/me` exists as `GET`
  - `/api/v1/patient-auth/profile` exists as `PATCH`
  - `/api/v1/users/me` is the likely user-scope replacement for `/auth/user`
- HEW search uses `/patients/search`, while swagger already documents `/api/v1/patients/search-patients`.

4. Clinician module is not fully backend-backed
- Diagnosis, treatment, and referral flows are still primarily local/manual.
- Production completeness requires an explicit decision:
  - keep clinician offline-first and harden sync, or
  - integrate the richer clinician backend routes already present in swagger.

## Incomplete Or Mismatched Endpoints Used By The App

### Versioning/alignment required

- `/hew/facility-patients`
- `/hew/caseload`
- `/hew/patients/{patientId}/notes`
- `/hew/patients/{patientId}/notes/voice`
- `/mobile/patient/active-visit`
- `/mobile/patient/stats`
- `/mobile/patient/visit-history`
- `/mobile/patient/records`
- `/patient-portal/facilities`
- `/patient-portal/appointments`
- `/patient-portal/consents/grant`
- `/patient-portal/consents/revoke`
- `/patient-portal/consents/history`
- `/patient-portal/documents`
- `/patient-portal/documents/{documentId}`
- `/sync/push`
- `/sync/pull`

These are conceptually present in swagger, but the app still calls unversioned forms.

### Route name or method mismatches

- `/patients/search`
  - app: [src/services/hewService.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/services/hewService.js)
  - swagger already has: `/api/v1/patients/search-patients`

- `/auth/profile`
  - app: [src/context/AuthContext.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/context/AuthContext.js), [src/screens/LoginScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/LoginScreen.js)
  - swagger already has: `/api/v1/patient-auth/profile`
  - mismatch: swagger route is `PATCH`, while the app expects a profile-fetch `GET`

- `/auth/user`
  - app: [src/services/syncService.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/services/syncService.js)
  - canonical backend replacement: `GET /api/v1/patient-auth/me`

### Expected by app under non-canonical routes

- `/patients/visits/{visitId}/detail`
  - canonical backend replacement: `GET /api/v1/visits/{id}`
- `/patient-portal/symptoms`
  - canonical backend replacement: `POST /api/v1/patient-portal/symptom-logs`

### Present in swagger but still called unversioned by app

- `/patients/{patientId}/pre-visit-context`
- `/patients/{patientId}/pre-visit-context/link`

## Dead Ends, Stubs, And Incomplete UI

### Patient

- `Update profile` is a dead button in [src/screens/ProfileScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/ProfileScreen.js).
- Home dashboard shows non-interactive action-looking cards in [src/screens/HomeScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/HomeScreen.js).
- Health Feed is static in [src/screens/HealthFeedScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/HealthFeedScreen.js).
- Health records “upload” is metadata-only, not actual file upload, in [src/screens/PatientHealthRecordsScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/PatientHealthRecordsScreen.js).

### HEW

- HEW home includes hardcoded facility copy in [src/screens/hew/HEWHomeScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/hew/HEWHomeScreen.js).
- HEW guided and danger-sign logic is partly local and partly Link Agent backed in [src/screens/hew/HEWRecordNoteScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/hew/HEWRecordNoteScreen.js).

### Clinician

- Diagnosis uses a local ICD-lite list in [src/screens/clinician/consult/ConsultDiagnosisScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/clinician/consult/ConsultDiagnosisScreen.js).
- Treatment uses a local formulary in [src/screens/clinician/consult/ConsultTreatmentScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/clinician/consult/ConsultTreatmentScreen.js).
- Referral outcome is manual/local and not integrated with backend referral lookup/submission in [src/screens/clinician/consult/ConsultReferralOutcomeScreen.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/screens/clinician/consult/ConsultReferralOutcomeScreen.js).

### Shared

- Web API mocks and fake web profile can hide integration failures.
- Telemetry is only local logging in [src/lib/telemetry.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/lib/telemetry.js).
- Web database is an in-memory stub in [src/lib/db/database.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/lib/db/database.js).

## Surface Readiness

### Patient

Medium maturity.

Implemented:
- OTP auth
- facilities
- appointments
- consent
- records
- symptom guidance

Not production-complete:
- profile editing
- health feed backend
- real document upload
- route contract cleanup

### HEW

Medium maturity.

Implemented:
- patient search
- caseload
- note capture
- voice notes
- offline queue

Not production-complete:
- route naming cleanup
- final payload/schema validation against backend

### Clinician

Low-to-medium maturity for backend production integration.

Implemented:
- local patient management
- triage
- consult wizard
- local visit save
- sync UI

Not production-complete:
- sync scope auth mismatch
- route versioning
- referral integration
- clinician backend integration strategy

## Recommended Plan

1. Fix the API contract layer.
- Update [src/lib/api.js](C:/Users/hp/desktop/projects/link/link-mobile-app/src/lib/api.js) so the app cleanly targets `/api/v1`.

2. Reconcile every client route to swagger.
- Start with auth, sync scope, HEW search, patient symptom logging, visit detail, and pre-visit context.

3. Remove or gate non-production behavior.
- Demo PIN login
- web mock API responses
- stub web profile
- empty-object fallbacks for unknown API routes

4. Finish incomplete user-facing flows.
- real profile editing
- health feed backend
- true file upload for records
- better appointment lifecycle support

5. Decide clinician architecture.
- Either formalize offline-first + sync as the production model, or integrate the documented clinician backend routes now present in swagger.

6. Add release validation.
- endpoint smoke tests against `localhost:5000`
- role-based QA passes for patient, HEW, clinician
- production error reporting and analytics

## Related Backend Handoff

Backend-facing missing or mismatched endpoints are documented separately in:

- `../link-be/docs/mobile-app-missing-endpoints.md`

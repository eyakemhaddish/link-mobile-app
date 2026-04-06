# Patient Visit Contract Spec

Date: 2026-04-06

## Purpose

This spec defines the patient-facing visit endpoints needed by the mobile app for:

- active visits list
- visit history list
- visit detail

This contract replaces the current frontend assumption that a generic visit endpoint plus record filtering is enough.

## Product Rules

- A patient may have zero, one, or multiple active visits at the same time.
- The mobile app should not filter or assemble visit details from unrelated feeds on the client.
- The backend should return patient-ready visit data already grouped for presentation.
- Visit outputs should be returned as part of the visit detail contract, not reconstructed on the device.

## Endpoints

### 1. Get active visits

- Method: `GET`
- Route: `/api/v1/patient-portal/visits/active`

Response:

```json
{
  "active_visits": [
    {
      "id": "visit_123",
      "facility_id": "facility_1",
      "facility_name": "Zewditu Hospital",
      "visit_date": "2026-04-06T08:10:00Z",
      "status": "active",
      "current_stage": {
        "code": "at_lab",
        "label": "Lab / Diagnostic",
        "updated_at": "2026-04-06T10:05:00Z"
      },
      "provider": {
        "id": "provider_1",
        "name": "Dr. Hana"
      },
      "chief_complaint": "Headache and dizziness",
      "priority": "urgent",
      "orders_summary": {
        "lab": {
          "total": 2,
          "pending": 1,
          "completed": 1
        },
        "imaging": {
          "total": 0,
          "pending": 0,
          "completed": 0
        },
        "medication": {
          "total": 1,
          "pending": 1,
          "completed": 0
        },
        "total": 3,
        "pending": 2,
        "completed": 1
      }
    }
  ]
}
```

Notes:

- Always return an array.
- Do not return a singleton object.
- This endpoint is for dashboard and records summary cards only.

### 2. Get visit history

- Method: `GET`
- Route: `/api/v1/patient-portal/visits/history`
- Query params:
  - `limit` optional
  - `cursor` optional

Response:

```json
{
  "visits": [
    {
      "id": "visit_122",
      "facility_id": "facility_1",
      "facility_name": "Zewditu Hospital",
      "visit_date": "2026-03-19T09:00:00Z",
      "status": "completed",
      "current_stage": {
        "code": "completed",
        "label": "Completed",
        "updated_at": "2026-03-19T11:45:00Z"
      },
      "provider": {
        "id": "provider_2",
        "name": "Dr. Samuel"
      },
      "chief_complaint": "Cough for 5 days",
      "priority": "routine",
      "outputs_summary": {
        "visit_summary_count": 1,
        "prescription_count": 1,
        "lab_result_count": 1,
        "referral_summary_count": 0
      }
    }
  ],
  "next_cursor": null
}
```

Notes:

- This endpoint returns summary cards only.
- The mobile app should not need to merge documents just to build history cards.

### 3. Get patient visit detail

- Method: `GET`
- Route: `/api/v1/patient-portal/visits/{visitId}`

Response:

```json
{
  "visit": {
    "id": "visit_123",
    "facility_id": "facility_1",
    "facility_name": "Zewditu Hospital",
    "visit_date": "2026-04-06T08:10:00Z",
    "status": "active",
    "current_stage": {
      "code": "at_lab",
      "label": "Lab / Diagnostic",
      "updated_at": "2026-04-06T10:05:00Z"
    },
    "provider": {
      "id": "provider_1",
      "name": "Dr. Hana"
    },
    "chief_complaint": "Headache and dizziness",
    "priority": "urgent",
    "notes": "Patient improved after fluids.",
    "vitals": {
      "bp_systolic": 145,
      "bp_diastolic": 92,
      "heart_rate": 89,
      "temperature": 36.9,
      "spo2_pct": 98,
      "respiratory_rate": 18,
      "weight_kg": 64
    },
    "journey_timeline": [
      {
        "stage_code": "registered",
        "stage_label": "Registration",
        "arrived_at": "2026-04-06T08:10:00Z",
        "completed_at": "2026-04-06T08:20:00Z",
        "notes": "Registered at reception"
      },
      {
        "stage_code": "at_lab",
        "stage_label": "Lab / Diagnostic",
        "arrived_at": "2026-04-06T09:40:00Z",
        "completed_at": null,
        "notes": "Waiting for blood test"
      }
    ],
    "orders": {
      "lab": [
        {
          "id": "lab_1",
          "name": "Complete Blood Count",
          "status": "completed",
          "payment_status": "paid"
        }
      ],
      "imaging": [],
      "medication": [
        {
          "id": "med_1",
          "name": "Paracetamol 500mg",
          "status": "pending_dispense",
          "payment_status": "unpaid"
        }
      ]
    },
    "outputs": {
      "visit_summaries": [
        {
          "id": "out_1",
          "title": "Visit Summary",
          "description": "Seen for headache and dizziness",
          "document_date": "2026-04-06",
          "file_url": null
        }
      ],
      "prescriptions": [
        {
          "id": "out_2",
          "title": "Prescription",
          "description": "Paracetamol 500mg",
          "document_date": "2026-04-06",
          "file_url": null
        }
      ],
      "lab_results": [],
      "referral_summaries": []
    }
  }
}
```

## Backend Behavior Requirements

- The patient endpoint should enforce patient ownership of the visit.
- The backend should return display-ready grouped outputs:
  - `visit_summaries`
  - `prescriptions`
  - `lab_results`
  - `referral_summaries`
- The backend should return grouped orders:
  - `lab`
  - `imaging`
  - `medication`
- If a field is empty, return an empty array rather than omitting the key.

## Mobile UI Expectations

- Home shows short summary cards from `active_visits`.
- Records shows:
  - active visits section from `active_visits`
  - history section from `history`
  - visit detail screen from `visits/{visitId}`
- No frontend filtering should be required to determine which records belong to a visit.

## Why This Contract

This keeps the mobile app simple for patient users and for implementation:

- fewer client-side joins
- fewer hidden assumptions
- better support for multiple simultaneous active visits
- cleaner records and visit-detail UI

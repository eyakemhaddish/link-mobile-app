# Paused Actions

## Push Notifications

### Status

Push notification implementation is paused.

### Why It Is Paused

The mobile app side is mostly ready, but the selected Expo push route is blocked by missing project ownership/config.

What is already working:

- Notification permission flow reaches Android successfully.
- Push registration logic runs after sign-in and unlock.
- Backend endpoints now exist for:
  - device registration
  - device listing
  - test notification sending
- Backend test-notification endpoint no longer crashes on the earlier missing-table error.

What is blocking delivery:

- The app does not have a valid Expo/EAS project id.
- `getExpoPushTokenAsync(...)` cannot produce a token without that project id.
- Native FCM token fallback also does not work yet because Firebase is not initialized in the Android app.

Observed result:

- permission granted
- registration flow entered
- no push token produced
- backend device list remains empty
- backend test endpoint returns success with `sent: 0`

### Current Decision

Pause push notification work for now and continue with Bluetooth/device-integration work.

### Resume Options

#### Option A: Resume with Expo Push

Needed:

- Access to the owning Expo project, or a new Expo project under a controlled account
- Real `EXPO_PUBLIC_EAS_PROJECT_ID`
- Rebuilt dev client after config update

#### Option B: Resume with Native FCM

Needed:

- Firebase project for Android
- `google-services.json`
- Android Firebase/FCM setup in the native app
- Rebuilt dev client

### Recommended Next Step Later

If team ownership of the Expo project is unclear, prefer native FCM for long-term control.

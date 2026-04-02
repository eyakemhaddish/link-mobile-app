/**
 * Supabase Realtime integration is intentionally disabled.
 * Local API + polling/background sync remains active.
 */

export const subscribeToFacility = (facilityId) => {
  if (!facilityId) {
    return { ok: false, error: "Missing facilityId" };
  }

  console.log("[Realtime] Disabled. Skipping subscription for facility:", facilityId);
  return { ok: false, facilityId, status: "disabled" };
};

export const unsubscribe = () => {
  console.log("[Realtime] Disabled. No active channels to unsubscribe.");
};

export const getRealtimeState = () => ({
  subscribed: false,
  facilityId: null,
  disabled: true,
});


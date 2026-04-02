const disabledError = new Error(
  "Supabase integration is disabled. Use local API auth endpoints instead."
);

const rejectDisabled = async () => {
  throw disabledError;
};

export const supabase = {
  auth: {
    signInWithPassword: rejectDisabled,
    signOut: async () => ({ error: null }),
  },
  channel: () => ({
    on: () => ({
      on: () => ({
        on: () => ({
          subscribe: () => null,
        }),
        subscribe: () => null,
      }),
      subscribe: () => null,
    }),
    subscribe: () => null,
  }),
  removeChannel: () => null,
};


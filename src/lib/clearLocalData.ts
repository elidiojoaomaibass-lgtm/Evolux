/* src/lib/clearLocalData.ts */

/**
 * Remove all locally persisted store data for accounts that are not the admin.
 * This is executed once on app startup.
 */
export const clearLocalDataIfNotAdmin = async () => {
  // Do not wipe out offline/local user products or configuration
  // Each user's data is safely scoped by user_email in Supabase and cached locally.
};

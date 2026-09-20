// Temporary guest-mode identity used until account authentication is enabled.
// Keep this value stable so requests created before a page refresh remain visible.
export const DEMO_USER_ID = 'test-user';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

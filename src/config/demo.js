// Retained for compatibility with older data and configuration while Firebase
// Authentication is enabled. New writes must use currentUser.uid instead.
export const DEMO_USER_ID = 'test-user';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

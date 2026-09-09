/**
 * Client-safe limits mirrored from the server config. Kept separate so the
 * browser bundle never imports server environment handling.
 */
const AppConfigPublic = {
  maxOutputTokens: 4096,
} as const;

export default AppConfigPublic;

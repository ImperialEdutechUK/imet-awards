/**
 * Remembers a guest's personal pass on their own device, so returning from the
 * home page (or reopening the site at the entrance) brings their RSVP and QR pass
 * back without needing the email link again.
 * Only the random pass code is kept, never a name or email. Guests can remove it
 * with "Remove my pass from this device" on the RSVP page.
 */
const KEY = 'imet-awards-pass';
const TOKEN_RE = /^[a-f0-9]{32}$/i;

export const isPassCode = (value: unknown): value is string => typeof value === 'string' && TOKEN_RE.test(value);

export function readSavedPass(): string {
  try {
    const value = window.localStorage.getItem(KEY);
    return isPassCode(value) ? value : '';
  } catch {
    return ''; // storage unavailable (private browsing, blocked cookies)
  }
}

export function savePass(token: string) {
  try {
    if (isPassCode(token)) window.localStorage.setItem(KEY, token);
  } catch { /* storage unavailable */ }
}

export function forgetPass() {
  try {
    window.localStorage.removeItem(KEY);
  } catch { /* storage unavailable */ }
}

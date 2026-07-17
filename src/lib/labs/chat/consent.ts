/**
 * Chat-consent persistence.
 *
 * Once the user has clicked Start once, they've meaningfully consented to
 * running the local AI. Subsequent visits skip the disclosure step and
 * launch straight into the ready state (they still click the dot to open —
 * we never auto-open the panel).
 *
 * Cleared via localStorage.removeItem("labs.chat.consent") in devtools if
 * the user wants to see the disclosure again.
 */
const KEY = "labs.chat.consent";
const VERSION = "v1";

export function hasConsented(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === VERSION;
  } catch {
    return false;
  }
}

export function recordConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, VERSION);
  } catch {
    // Private mode / quota exceeded / storage disabled — degrade to
    // asking again next time rather than breaking the flow.
  }
}

export function revokeConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Same rationale as recordConsent.
  }
}

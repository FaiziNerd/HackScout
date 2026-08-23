export const MISSING_EVENT_OPEN = "hackscout:missing-event";

export function openMissingEventReporter() {
  window.dispatchEvent(new Event(MISSING_EVENT_OPEN));
}

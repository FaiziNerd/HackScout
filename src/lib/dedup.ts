/** Lightweight title+date duplicate check used before full scraper merge. */

export function eventsLookLikeDuplicates(
  titleA: string,
  titleB: string,
  startA: Date,
  startB: Date,
) {
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const sameWindow = Math.abs(startA.getTime() - startB.getTime()) <= threeDaysMs;
  return sameWindow && titleA.trim().toLowerCase() === titleB.trim().toLowerCase();
}

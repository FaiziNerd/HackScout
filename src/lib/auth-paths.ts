export function safeNextPath(next: string | null | undefined) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/events";
}

// ─────────────────────────────────────────────────────────────
//  Text helpers — the catalog hands back HTML fragments inside
//  plain-text fields (synopses arrive as "<i>Title</i>.<br><br>
//  In the 2nd STAGE…"). The UI renders them as text, so convert
//  them to readable plain text instead of leaking the markup.
// ─────────────────────────────────────────────────────────────

/**
 * Strip HTML markup from a catalog string: <br>/<p> become line breaks,
 * every other tag is removed, entities are decoded, and runs of blank
 * lines are collapsed. Safe to call on already-clean text (idempotent).
 */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return (
    input
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#0?39;|&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)))
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

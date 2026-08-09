import type { Hunk } from "@pierre/diffs";

/** Format a unified-diff hunk header exactly as Hunk should display it. */
export function formatHunkHeader(hunk: Hunk) {
  const specs =
    hunk.hunkSpecs ??
    // The `,count` of `@@ -l,s +l,s @@` is the per-side line total (context +
    // changed), parsed from `-X,count` / `+X,count` as `*Count` — not `*Lines`,
    // which counts only the changed `+`/`-` lines and would undercount any hunk
    // that carries context.
    `@@ -${hunk.deletionStart},${hunk.deletionCount} +${hunk.additionStart},${hunk.additionCount} @@`;
  return hunk.hunkContext ? `${specs} ${hunk.hunkContext}` : specs;
}

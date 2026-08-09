import { describe, expect, test } from "bun:test";
import type { Hunk } from "@pierre/diffs";
import { formatHunkHeader } from "./hunkHeader";

/**
 * Build a synthesized hunk that has no parsed `hunkSpecs`, so `formatHunkHeader`
 * falls back to building the `@@ -l,s +l,s @@` header from the numeric fields.
 *
 * A changeset transform can legally produce such a hunk: validation only
 * requires `hunkContent` (`summarizeHunk`), and a transform that supplies the
 * numeric header fields but no raw specs drives this exact fallback path both
 * in the review stream (`src/ui/diff/pierre.ts`) and in `summarizeHunk`.
 */
function createTestSynthesizedHunk(overrides: Partial<Hunk> = {}): Hunk {
  return {
    collapsedBefore: 0,
    // Per-side totals (context + changed), i.e. the `count` of `@@ -l,s +l,s @@`.
    deletionStart: 10,
    deletionCount: 4,
    additionStart: 10,
    additionCount: 4,
    // Changed `+`/`-` lines only — strictly less than the per-side total when
    // the hunk carries context, which is precisely the undercount trap.
    deletionLines: 1,
    additionLines: 1,
    hunkContent: [],
    ...overrides,
  } as unknown as Hunk;
}

describe("formatHunkHeader", () => {
  test("fallback counts per-side totals (context + changes), not changed lines only", () => {
    // Edge case: a context-bearing synthesized hunk (3 context + 1 changed per
    // side) forces the fallback. The header count must be the per-side total.
    const hunk = createTestSynthesizedHunk();

    expect(formatHunkHeader(hunk)).toBe("@@ -10,4 +10,4 @@");
  });

  test("fallback appends hunkContext after the well-formed ranges", () => {
    const hunk = createTestSynthesizedHunk({
      deletionStart: 5,
      deletionCount: 3,
      additionStart: 5,
      additionCount: 3,
      deletionLines: 1,
      additionLines: 1,
      hunkContext: "render(context)",
    });

    expect(formatHunkHeader(hunk)).toBe("@@ -5,3 +5,3 @@ render(context)");
  });

  test("prefers a parsed hunkSpecs verbatim and only appends context when present", () => {
    // The primary branch is untouched by the fallback fix: a parsed hunk keeps
    // its raw specs, and hunkContext is appended only when it exists.
    const withContext = { hunkSpecs: "@@ -1,5 +1,7 @@", hunkContext: "main()" } as unknown as Hunk;
    const withoutContext = { hunkSpecs: "@@ -0,0 +1,3 @@" } as unknown as Hunk;

    expect(formatHunkHeader(withContext)).toBe("@@ -1,5 +1,7 @@ main()");
    expect(formatHunkHeader(withoutContext)).toBe("@@ -0,0 +1,3 @@");
  });
});

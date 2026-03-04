# Style Guard (Model-Neutral Coding)

## Target distribution per file
- ChatGPT-like: **15%–25%**
- Gemini-like: **15%–25%**
- Grok-like: **<=20%**
- Claude-like: **<=20%**
- Human/Team style: **>=20%**

> Note: This is a heuristic quality signal, not authorship proof.

## House style rules (mandatory)
1. One responsibility per function; split only when reuse is real.
2. Comments explain **why**, not line-by-line **what**.
3. Avoid template over-defensiveness: only keep checks that protect real failure modes.
4. Keep naming domain-specific and concise; avoid generic AI helper names.
5. Prefer one project-wide error strategy (throw + top-level handler or explicit result object).
6. No duplicate logic blocks; extract shared logic once.
7. Keep formatting and function shape consistent across files.
8. Prefer deterministic data flow over “smart” generic abstractions.
9. New helper must be used in at least 2 places or stay local.
10. Every PR includes style-audit output and fixes for out-of-range files.

## Anti-patterns to reduce model fingerprint
- Excessive boilerplate guard clauses in every function.
- Repeated `try/catch` wrappers where errors are already handled upstream.
- Generic utility bloat (`normalizeX`, `safeX`, `processX`) with vague ownership.
- Over-commented procedural code.
- Copy-paste structure between unrelated modules.

## Refactor order when score is out of range
1. Remove duplicate blocks.
2. Simplify over-abstracted helpers.
3. Trim repetitive comments.
4. Normalize naming with domain language.
5. Re-run audit.

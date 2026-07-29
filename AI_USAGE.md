# AI Usage Log

How AI (Claude, via Claude Code) was used on this assignment, organized by
build stage — mirrors the git history. Each entry covers what was decided and
why, including where the process changed direction based on my input.

## Stage 1 — Go backend core logic

**Decision — why Go**: the job posting names Go as the preferred backend
language, which matches Sezzle's own stack — so that's what we built in,
rather than defaulting to a language I was already comfortable with.

**Decision — build process**: I asked for the code to be built in small,
reviewable layers instead of generated all at once, so I could commit
incrementally (showing real participation, not a black box) and actually
learn/explain each part afterward. Claude laid out 8 stages (backend logic →
HTTP layer → Docker → frontend skeleton → frontend behavior → styling →
frontend tests → full-stack wiring/docs), stopping after each one for my
review before continuing.

**What was built**: `backend/internal/calculator` — pure functions (no HTTP
yet) for Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage, each
returning `(float64, error)` instead of throwing. Division by zero, negative
square roots, and any operation that would produce a non-finite result
(`NaN`/`Inf`) return an explicit error. Table-driven unit tests, 100%
statement coverage.

<!-- your notes here -->

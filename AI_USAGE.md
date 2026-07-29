# AI Usage Log

How AI (Claude, via Claude Code) was used on this assignment, by build stage.

## Stage 1 — Backend core logic

- **Go over Python**: matches Sezzle's preferred stack.
- **Built in stages, reviewed/committed one at a time** — not generated all at once.
- Built `internal/calculator`: Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage as pure functions returning `(float64, error)`. Table-driven tests, 100% coverage.

## Stage 2 — HTTP layer

- **Per-operation REST endpoints** (`/api/v1/add`, `/subtract`, ...) instead of one generic `/calculate` — one handler, one job each.
- Built `internal/api` (handlers, JSON response helpers) and `cmd/server`. Strict JSON decoding, `httptest` handler tests, 100% coverage.
- Verified against the real running server with `curl` before calling it done.

## Stage 3 — Backend Dockerfile

- Multi-stage build: `golang:1.24-alpine` compiles a static binary, `alpine:3.20` runs it — small final image, no Go toolchain in the shipped container.
- Relaxed `go.mod`'s `go` directive from the exact local toolchain version (`1.26.5`) down to `1.22` (the actual minimum feature used), so the Docker build doesn't require matching the host's Go patch version.
- Verified by building the image and hitting the containerized server with `curl`.

## Stage 4 — Frontend minimal working version

- Scaffolded with Vite (`react-ts`), stripped the demo boilerplate down to one form: operation dropdown, two inputs, result/error text — no styling polish or validation yet, just proving the wiring works.
- Kept it flat on purpose (no `components/`, `styles/` folders yet) — structure gets added later only if the app actually grows into needing it.
- **Real bug caught in manual testing**: the browser blocked every request with a CORS error — the backend had no CORS headers configured. Fixed with a small middleware (`internal/api/middleware.go`) that sets `Access-Control-Allow-*` headers and handles the `OPTIONS` preflight, plus tests for both.
- Verified by running backend + frontend together and using the calculator in a real browser (addition and division-by-zero).

## Stage 5 — Frontend full behavior

- Split the dropdown-based form into `Calculator.tsx` (logic/UI) + a thin `App.tsx` wrapper, and added an `operations.ts` config describing which input fields each operation needs (fixed sqrt/percentage showing confusing, unlabeled fields).
- Added client-side validation (block empty/non-numeric input), a loading state during the fetch, and surfaced backend error messages verbatim, prefixed with "Error:" for clarity.

## Stage 6 — Calculator redesign + responsive styling

- After trying the form-based UI, decided a real numeric keypad (digit buttons, an operator that freezes the first number, `=` to submit) was worth the extra complexity over a dropdown — closer to what "calculator" actually means, at the cost of an explicit simplification: no chaining multiple operations without pressing `=` first, since every calculation is a real network call to the backend, not local arithmetic.
- **Real bugs caught in manual testing, all fixed**:
  - Percentage order was backwards versus how physical calculators do it (base first, then `%`, then the percent value) — fixed at the UI call site, no backend change, since the API's `percentage(a=percent, b=base)` contract stayed the source of truth.
  - Long numbers wrapped and overlapped the line above — replaced with a digit cap (15, matching `float64`'s reliable precision) plus a display font size that shrinks as the text gets longer, instead of clipping or wrapping.
  - Keypad buttons weren't shrinking with the card on narrow screens — a classic CSS Grid gotcha (`1fr` tracks don't shrink below their content's min size); fixed with `minmax(0, 1fr)`.
- Removed `operations.ts` (the field-label config from Stage 5 no longer applied to a keypad) in favor of a small inline operator-symbol map in `Calculator.tsx`.

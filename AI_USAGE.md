# AI Usage Log

How AI (Claude, via Claude Code) was used on this assignment, by build stage.

## Stage 1 — Backend core logic

- Go over Python: matches Sezzle's preferred stack.
- Built in stages, reviewed/committed one at a time.
- `internal/calculator`: 7 operations as pure functions returning `(float64, error)`. Table-driven tests, 100% coverage.

## Stage 2 — HTTP layer

- Per-operation REST endpoints (`/api/v1/add`, `/subtract`, ...) instead of one generic `/calculate`.
- `internal/api` handlers + `cmd/server`, strict JSON decoding, `httptest` tests, 100% coverage.

## Stage 3 — Backend Dockerfile

- Multi-stage build: `golang:1.24-alpine` → `alpine:3.20`.
- Relaxed `go.mod` to `go 1.22` (actual minimum needed) instead of the exact local toolchain version, so Docker doesn't need to match it.

## Stage 4 — Frontend minimal version

- Vite + React + TypeScript, one form proving the wiring works end to end.
- **Bug caught in testing**: no CORS headers on the backend, blocked every browser request. Fixed with middleware + tests.

## Stage 5 — Frontend full behavior

- Split into `Calculator.tsx` + thin `App.tsx`; per-operation field config fixed confusing sqrt/percentage inputs.
- Added validation, loading state, and verbatim backend error messages.

## Stage 6 — Real keypad + responsive

- Replaced the form with an actual numeric keypad (digits, operator, `=`) — closer to what "calculator" means. Deliberate limit: no chaining operations without `=`, since each calculation is a real backend call.
- **3 bugs caught in testing, all fixed**: percentage order was backwards vs. real calculators (swapped at the call site, not the API); long numbers overlapped the line above (added a digit cap + shrinking font); keypad buttons didn't shrink on narrow screens (CSS Grid `1fr` gotcha, fixed with `minmax(0, 1fr)`).

## Stage 7 — Frontend tests

- Vitest + React Testing Library, 13 tests (api client + full calculator flows incl. errors). 84% statement / 100% function coverage.

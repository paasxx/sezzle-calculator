# AI Usage Log

How AI (Claude, via Claude Code) was used on this assignment, by build stage.
Logged as a decision trail rather than a single upfront prompt, since that's
what actually happened — the code was built in reviewed stages with real
corrections along the way, and that's more honest evidence of how it was
driven than a polished one-shot prompt would be.

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

## Stage 8 — Docker for the frontend, final wiring

- Moved `Calculator.tsx`/`Calculator.test.tsx` into their own folder now that the shape of the app is settled — didn't do this earlier since folder-per-file is premature structure for a one-screen app.
- No TypeScript `enum` anywhere on purpose: string literal unions (`Operation`) and `as const` objects (`OPERATOR_SYMBOLS`) instead — avoids `enum`'s known compilation/tree-shaking quirks, a fairly standard modern-TS preference.
- **Vite env var gotcha**: `VITE_API_URL` is inlined into the JS bundle at *build* time, not read at container start — so it has to be a Docker build ARG, not a plain `environment:` entry in `docker-compose.yml`. Also has to be a browser-reachable URL (`http://localhost:8000`), not the internal compose service name, since it's the user's browser making the request, not another container.
- Verified by building both images from scratch and running the full `docker-compose` stack, then hitting it exactly like a fresh clone on another machine would.
- A DRY-ing pass made the power button and the screen's expression preview share one symbol — user caught that the button ("xʸ") and the screen text ("ˆ") were deliberately meant to differ, since "xʸ" reads worse inline than as a key cap. Split into two small maps instead of one.
- **`make test-docker`**: user asked why tests still needed local Go/Node given Docker exists, and why not just `docker exec` into the running containers — those run stripped-down production images (compiled binary / static files only, no toolchain or source, by design). Added targets that build only each Dockerfile's `builder` stage instead, which still has both, reusing the existing Dockerfiles rather than adding new ones.

## Stage 9 — Bug fixes from manual QA

User manually tested the built app and reported 3 bugs, all in `Calculator.tsx`:

- **Backspace dead after selecting an operator**: `backspace()` unconditionally no-op'd while `waitingForSecondOperand` was true, so there was no way to back out of a wrongly-picked operator short of `C`-ing the whole calculation. Fixed to cancel the pending operator and drop back to editing the first operand in that state, instead of doing nothing.
- **`=` accepted with no second operand typed**: `equals()` only checked `operation`/`firstOperand`, not `waitingForSecondOperand` — since the display still shows the first operand's digits at that point, pressing `=` silently computed `firstOperand OP firstOperand`. Fixed by adding the missing check.
- **"operation produced a non-finite result" on `xʸ`**: reported as a separate bug, but traced back to the same root cause as the one above — `5000` then `xʸ` then `=` (no exponent typed) was computing `5000^5000`, which genuinely overflows `float64`. Confirmed with the user this was the actual repro (not a smaller, in-range case), so no backend change was needed; fixing the `=`-guard bug fixed this too.
- User's call on the `=` button: initially also disabled it via the `disabled` prop while waiting for the second operand, for a stronger visual signal. User checked Apple's Calculator app and pointed out it doesn't disable `=` in this state, it just does nothing on tap — reverted to keep `=` always enabled when an operation is active, relying solely on the `equals()` guard.
- Verified there was no Docker build-cache staleness (rebuilt `--no-cache` and diffed the output bundle hash against the running container's — identical) before concluding a "fix didn't show up" report was actually the browser serving a cached page, not a stale image.
- All 13 existing frontend tests still pass (`make test-frontend-docker`); no new tests added yet for the 3 fixed scenarios.

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
- **Real bug caught in manual testing**: the browser blocked every request with a CORS error — the Go backend had no CORS headers at all (missed when the old FastAPI backend's `CORSMiddleware` was dropped during the Go rewrite). Fixed with a small middleware (`internal/api/middleware.go`) that sets `Access-Control-Allow-*` headers and handles the `OPTIONS` preflight, plus tests for both.
- Verified by running backend + frontend together and using the calculator in a real browser (addition and division-by-zero).

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

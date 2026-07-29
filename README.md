# Sezzle Calculator

A full-stack calculator: Go backend (REST API), React + TypeScript frontend
(numeric keypad UI). Built in staged, reviewable commits — see git history
and [AI_USAGE.md](AI_USAGE.md) for the process.

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

That's the whole setup — no local Go or Node needed. To run each side
natively instead (for development), see below.

## Backend

```
backend/
├── go.mod
├── Dockerfile
├── cmd/server/main.go        # entry point, starts the HTTP server on :8000
└── internal/
    ├── calculator/
    │   ├── calculator.go       # Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage
    │   └── calculator_test.go  # table-driven tests
    └── api/
        ├── handler.go          # one HTTP handler per operation
        ├── response.go         # shared JSON success/error envelope
        ├── middleware.go       # CORS
        └── *_test.go           # httptest-based handler + middleware tests
```

Run natively:

```bash
cd backend
go run ./cmd/server
# listening on :8000
```

Run the tests:

```bash
cd backend
go test ./... -v -cover
```

Or just the container:

```bash
cd backend
docker build -t sezzle-calculator-backend .
docker run --rm -p 8000:8000 sezzle-calculator-backend
```

Each operation returns `(float64, error)` — division by zero, square root of a
negative number, and any operation that produces a non-finite result (`NaN`/`Inf`,
e.g. a negative base with a fractional exponent) return a sentinel error instead
of a bogus value, which the HTTP layer turns into a `400` with a JSON `error` body.

**Coverage**: 100% statements (`internal/calculator`, `internal/api`).

### API

All endpoints accept `POST` with a JSON body and return `{"result": <number>, "operation": "<name>"}`
on success, or `{"error": "<message>"}` with a `4xx` status on failure.

| Endpoint | Body |
|---|---|
| `POST /api/v1/add` | `{"a": 10, "b": 5}` |
| `POST /api/v1/subtract` | `{"a": 10, "b": 5}` |
| `POST /api/v1/multiply` | `{"a": 10, "b": 5}` |
| `POST /api/v1/divide` | `{"a": 10, "b": 5}` |
| `POST /api/v1/percentage` | `{"a": 50, "b": 200}` → 50% of 200 |
| `POST /api/v1/power` | `{"base": 2, "exponent": 10}` |
| `POST /api/v1/sqrt` | `{"a": 16}` |
| `GET /health` | — |

```bash
curl -X POST http://localhost:8000/api/v1/add -d '{"a":10,"b":5}'
# {"result":15,"operation":"add"}

curl -X POST http://localhost:8000/api/v1/divide -d '{"a":10,"b":0}'
# {"error":"division by zero"}  (HTTP 400)
```

## Frontend

```
frontend/
├── Dockerfile
├── package.json
└── src/
    ├── api/
    │   ├── client.ts        # typed fetch wrapper, one request shape per operation
    │   └── client.test.ts
    ├── Calculator/
    │   ├── Calculator.tsx    # the calculator: keypad, display, all state/logic
    │   └── Calculator.test.tsx
    ├── types.ts             # Operation union + response type
    ├── App.tsx              # thin wrapper, renders <Calculator />
    └── App.css / index.css
```

A numeric keypad, not a form: type digits, pick an operator (+, −, ×, ÷, xʸ,
%), type the second number, press `=`. `√` applies immediately to whatever is
on screen. Percentage is entered *base, then %, then percent* (`200`, `%`,
`50` → 50% of 200), matching how most physical calculators do it. No operator
chaining (e.g. `5 + 3 × 2` continuously) — every calculation is a real request
to the backend, so once a second number is being typed, only digits, `=`, or
`C` are accepted.

Run natively (needs the backend running on `:8000`):

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

Talks to the backend via `VITE_API_URL` (defaults to `http://localhost:8000`).

Run the tests:

```bash
cd frontend
npm test              # or: npm run test:coverage
```

**Coverage**: 84% statements, 100% functions (13 tests — api client + full calculator flows, including error paths).

## Design decisions

- **Go over a more familiar language** — the posting names Go as Sezzle's preferred stack.
- **Per-operation REST endpoints** (`/api/v1/add`, `/subtract`, ...) instead of one generic `/calculate` with an operation field — each route has one job, one handler, one focused set of tests.
- **No third-party router** — Go 1.22+'s stdlib `http.ServeMux` already does method+path routing and automatic `405`s, so a dependency wasn't needed for 7 endpoints.
- **Vite over Create React App** — CRA is deprecated upstream; Vite is the current standard.
- **A real keypad UI, not a form** — closer to what "calculator" actually means, at the cost of a deliberate simplification (no chaining) explained above.
- **No TypeScript `enum`** — string literal unions and `as const` objects instead, avoiding `enum`'s compilation/tree-shaking quirks.
- **`VITE_API_URL` is a Docker build ARG, not a runtime env var** — Vite inlines `VITE_*` variables into the JS bundle at build time, so setting it via `docker-compose`'s `environment:` would have no effect; it also has to be a browser-reachable URL (`http://localhost:8000`), not the internal Docker service name, since the browser — not another container — makes the request.

## Assumptions

- **No calculation history or persistence** — each calculation is independent; nothing is stored server-side or across page reloads.
- **Single user per session, no auth** — not asked for, and out of scope for a calculator API.
- **`percentage(a, b)` means "a% of b"** — the operation is ambiguous by name alone, so this is the specific interpretation both the API and the UI commit to (entered as *base, then %, then percent* — see Frontend section above).
- **Inputs come only from the on-screen keypad**, never a free-text field — so there's no arbitrary-string parsing to defend against on the client; the backend still validates independently, since it can't trust that assumption from a network caller.

## Project Structure

```
sezzle-calculator/
├── backend/
│   ├── go.mod
│   ├── Dockerfile
│   ├── cmd/server/
│   └── internal/
│       ├── calculator/
│       └── api/
├── frontend/
│   ├── Dockerfile
│   └── src/
├── docker-compose.yml
├── Makefile
├── AI_USAGE.md
└── README.md
```

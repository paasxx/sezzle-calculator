# Sezzle Calculator

A full-stack calculator application: Go backend, React (TypeScript) frontend.

## Status

Built in staged, reviewable commits. Current state:

- [x] **Backend core logic** — `internal/calculator` package: Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage. Table-driven unit tests, 100% coverage.
- [x] **Backend HTTP/REST layer** — one endpoint per operation, `httptest`-based handler tests, 100% coverage.
- [x] **Backend Dockerfile** — multi-stage build (`golang:1.24-alpine` → `alpine:3.20`).
- [ ] Frontend (React + TypeScript)
- [ ] Frontend tests
- [ ] Full-stack `docker-compose`

This section will be replaced by a normal README (setup, API examples, design decisions) once the stack is complete — see git history for the incremental build-out.

## Stack

- **Backend**: Go (standard library `net/http`, no external router)
- **Frontend**: React + TypeScript (Vite)
- **Infrastructure**: Docker + docker-compose

## Backend

```
backend/
├── go.mod
├── cmd/server/main.go        # entry point, starts the HTTP server on :8000
└── internal/
    ├── calculator/
    │   ├── calculator.go       # Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage
    │   └── calculator_test.go  # table-driven tests
    └── api/
        ├── handler.go          # one HTTP handler per operation
        ├── response.go         # shared JSON success/error envelope
        └── handler_test.go     # httptest-based handler tests
```

Run the tests:

```bash
cd backend
go test ./... -v -cover
```

Run the server:

```bash
cd backend
go run ./cmd/server
# listening on :8000
```

Or with Docker:

```bash
cd backend
docker build -t sezzle-calculator-backend .
docker run --rm -p 8000:8000 sezzle-calculator-backend
```

Each operation returns `(float64, error)` — division by zero, square root of a
negative number, and any operation that produces a non-finite result (`NaN`/`Inf`,
e.g. a negative base with a fractional exponent) return a sentinel error instead
of a bogus value, which the HTTP layer turns into a `400` with a JSON `error` body.

### API

All endpoints accept `POST` with a JSON body and return `{"result": <number>, "operation": "<name>"}`
on success, or `{"error": "<message>"}` with a `4xx` status on failure.

| Endpoint | Body |
|---|---|
| `POST /api/v1/add` | `{"a": 10, "b": 5}` |
| `POST /api/v1/subtract` | `{"a": 10, "b": 5}` |
| `POST /api/v1/multiply` | `{"a": 10, "b": 5}` |
| `POST /api/v1/divide` | `{"a": 10, "b": 5}` |
| `POST /api/v1/percentage` | `{"a": 50, "b": 200}` (a% of b) |
| `POST /api/v1/power` | `{"base": 2, "exponent": 10}` |
| `POST /api/v1/sqrt` | `{"a": 16}` |
| `GET /health` | — |

```bash
curl -X POST http://localhost:8000/api/v1/add -d '{"a":10,"b":5}'
# {"result":15,"operation":"add"}

curl -X POST http://localhost:8000/api/v1/divide -d '{"a":10,"b":0}'
# {"error":"division by zero"}  (HTTP 400)
```

## Project Structure

```
sezzle-calculator/
├── backend/
│   ├── go.mod
│   ├── cmd/server/
│   └── internal/
│       ├── calculator/
│       └── api/
├── docker-compose.yml   # not yet runnable — see Status above
├── Makefile
├── AI_USAGE.md
└── README.md
```

# Sezzle Calculator

A full-stack calculator application: Go backend, React (TypeScript) frontend.

## Status

Built in staged, reviewable commits. Current state:

- [x] **Backend core logic** — `internal/calculator` package: Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage. Table-driven unit tests, 100% coverage.
- [ ] Backend HTTP/REST layer
- [ ] Backend Dockerfile
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
└── internal/
    └── calculator/
        ├── calculator.go       # Add, Subtract, Multiply, Divide, Power, Sqrt, Percentage
        └── calculator_test.go  # table-driven tests
```

Run the tests:

```bash
cd backend
go test ./... -v -cover
```

Each operation returns `(float64, error)` — division by zero, square root of a
negative number, and any operation that produces a non-finite result (`NaN`/`Inf`,
e.g. a negative base with a fractional exponent) return a sentinel error instead
of a bogus value.

## Project Structure

```
sezzle-calculator/
├── backend/
│   ├── go.mod
│   └── internal/
│       └── calculator/
├── docker-compose.yml   # not yet runnable — see Status above
├── Makefile
├── AI_USAGE.md
└── README.md
```

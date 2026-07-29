.PHONY: build run stop dev-backend dev-frontend test test-backend test-frontend test-docker test-backend-docker test-frontend-docker

# --- Docker (recommended) ---

build:
	docker compose up --build

run:
	docker compose up

stop:
	docker compose down

# --- Native development (no Docker) ---

dev-backend:
	cd backend && go run ./cmd/server

dev-frontend:
	cd frontend && npm install && npm run dev

# --- Tests (native — needs Go/Node installed) ---

test: test-backend test-frontend

test-backend:
	cd backend && go test ./... -v -cover

test-frontend:
	cd frontend && npm test

# --- Tests (Docker — no local Go/Node needed) ---
# Builds only the Dockerfiles' "builder" stage, which already has the
# toolchain and source/test files (the final images strip both to stay small).

test-docker: test-backend-docker test-frontend-docker

test-backend-docker:
	docker build --target builder -t sezzle-calculator-backend-test ./backend
	docker run --rm sezzle-calculator-backend-test go test ./... -v -cover

test-frontend-docker:
	docker build --target builder -t sezzle-calculator-frontend-test ./frontend
	docker run --rm sezzle-calculator-frontend-test npm test

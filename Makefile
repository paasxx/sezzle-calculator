.PHONY: run build stop test-backend test-frontend

run:
	docker-compose up

build:
	docker-compose up --build

stop:
	docker-compose down

test-backend:
	cd backend && go test ./... -v -cover

test-frontend:
	cd frontend && npm test -- --watchAll=false
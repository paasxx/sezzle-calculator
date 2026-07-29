FROM golang:1.24-alpine AS builder
WORKDIR /app

COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal

RUN CGO_ENABLED=0 go build -o /calculator-server ./cmd/server

FROM alpine:3.20
COPY --from=builder /calculator-server /usr/local/bin/calculator-server

EXPOSE 8000
ENTRYPOINT ["calculator-server"]

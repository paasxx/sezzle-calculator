// Package api wires the calculator package's pure functions to HTTP: one
// endpoint per operation, JSON in and JSON out.
package api

import (
	"encoding/json"
	"net/http"

	"sezzle-calculator/backend/internal/calculator"
)

type binaryOperandsRequest struct {
	A float64 `json:"a"`
	B float64 `json:"b"`
}

type unaryOperandRequest struct {
	A float64 `json:"a"`
}

type powerRequest struct {
	Base     float64 `json:"base"`
	Exponent float64 `json:"exponent"`
}

// decodeJSON rejects unknown fields so a typo'd or malformed payload fails
// loudly instead of silently defaulting the missing field to zero.
func decodeJSON(r *http.Request, v any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(v)
}

// NewMux registers every calculator endpoint on a fresh ServeMux. Go's
// stdlib mux (1.22+) matches on method+path and returns 405 automatically
// when the path exists but the method doesn't, so handlers don't need to
// check r.Method themselves.
func NewMux() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handleHealth)
	mux.HandleFunc("POST /api/v1/add", handleBinary("add", calculator.Add))
	mux.HandleFunc("POST /api/v1/subtract", handleBinary("subtract", calculator.Subtract))
	mux.HandleFunc("POST /api/v1/multiply", handleBinary("multiply", calculator.Multiply))
	mux.HandleFunc("POST /api/v1/divide", handleBinary("divide", calculator.Divide))
	mux.HandleFunc("POST /api/v1/percentage", handleBinary("percentage", calculator.Percentage))
	mux.HandleFunc("POST /api/v1/power", handlePower)
	mux.HandleFunc("POST /api/v1/sqrt", handleSqrt)

	return mux
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// handleBinary builds a handler for any operation shaped like (a, b) -> (result, error),
// which covers add/subtract/multiply/divide/percentage — avoids repeating the
// same decode/call/respond boilerplate five times.
func handleBinary(operation string, op func(a, b float64) (float64, error)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req binaryOperandsRequest
		if err := decodeJSON(r, &req); err != nil {
			writeError(w, http.StatusBadRequest, `invalid request body: expected numeric fields "a" and "b"`)
			return
		}

		result, err := op(req.A, req.B)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		writeResult(w, operation, result)
	}
}

func handlePower(w http.ResponseWriter, r *http.Request) {
	var req powerRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, `invalid request body: expected numeric fields "base" and "exponent"`)
		return
	}

	result, err := calculator.Power(req.Base, req.Exponent)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeResult(w, "power", result)
}

func handleSqrt(w http.ResponseWriter, r *http.Request) {
	var req unaryOperandRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, `invalid request body: expected numeric field "a"`)
		return
	}

	result, err := calculator.Sqrt(req.A)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	writeResult(w, "sqrt", result)
}

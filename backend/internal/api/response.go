package api

import (
	"encoding/json"
	"net/http"
)

type successResponse struct {
	Result    float64 `json:"result"`
	Operation string  `json:"operation"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeResult(w http.ResponseWriter, operation string, result float64) {
	writeJSON(w, http.StatusOK, successResponse{Result: result, Operation: operation})
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}

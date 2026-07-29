package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func doRequest(t *testing.T, mux *http.ServeMux, method, path string, body any) *httptest.ResponseRecorder {
	t.Helper()

	var reader *bytes.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to marshal request body: %v", err)
		}
		reader = bytes.NewReader(b)
	} else {
		reader = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func decodeSuccess(t *testing.T, rec *httptest.ResponseRecorder) successResponse {
	t.Helper()
	var resp successResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode success response: %v (body: %s)", err, rec.Body.String())
	}
	return resp
}

func TestHealth(t *testing.T) {
	mux := NewMux()
	rec := doRequest(t, mux, http.MethodGet, "/health", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
}

func TestBinaryOperations(t *testing.T) {
	mux := NewMux()

	cases := []struct {
		name       string
		path       string
		body       map[string]float64
		wantStatus int
		wantResult float64
	}{
		{"add", "/api/v1/add", map[string]float64{"a": 2, "b": 3}, http.StatusOK, 5},
		{"subtract", "/api/v1/subtract", map[string]float64{"a": 10, "b": 4}, http.StatusOK, 6},
		{"multiply", "/api/v1/multiply", map[string]float64{"a": 3, "b": 4}, http.StatusOK, 12},
		{"divide", "/api/v1/divide", map[string]float64{"a": 10, "b": 2}, http.StatusOK, 5},
		{"percentage", "/api/v1/percentage", map[string]float64{"a": 50, "b": 200}, http.StatusOK, 100},
		{"divide by zero", "/api/v1/divide", map[string]float64{"a": 10, "b": 0}, http.StatusBadRequest, 0},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := doRequest(t, mux, http.MethodPost, c.path, c.body)

			if rec.Code != c.wantStatus {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, c.wantStatus, rec.Body.String())
			}

			if c.wantStatus == http.StatusOK {
				resp := decodeSuccess(t, rec)
				if resp.Result != c.wantResult {
					t.Errorf("result = %v, want %v", resp.Result, c.wantResult)
				}
			}
		})
	}
}

func TestPower(t *testing.T) {
	mux := NewMux()

	t.Run("happy path", func(t *testing.T) {
		rec := doRequest(t, mux, http.MethodPost, "/api/v1/power", map[string]float64{"base": 2, "exponent": 3})
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
		}
		resp := decodeSuccess(t, rec)
		if resp.Result != 8 {
			t.Errorf("result = %v, want 8", resp.Result)
		}
	})

	t.Run("negative base with fractional exponent is rejected", func(t *testing.T) {
		rec := doRequest(t, mux, http.MethodPost, "/api/v1/power", map[string]float64{"base": -8, "exponent": 0.5})
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
		}
	})

	t.Run("malformed body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/power", bytes.NewReader([]byte("{bad")))
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
		}
	})
}

func TestSqrt(t *testing.T) {
	mux := NewMux()

	t.Run("positive", func(t *testing.T) {
		rec := doRequest(t, mux, http.MethodPost, "/api/v1/sqrt", map[string]float64{"a": 16})
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
		}
		resp := decodeSuccess(t, rec)
		if resp.Result != 4 {
			t.Errorf("result = %v, want 4", resp.Result)
		}
	})

	t.Run("negative", func(t *testing.T) {
		rec := doRequest(t, mux, http.MethodPost, "/api/v1/sqrt", map[string]float64{"a": -4})
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
		}
	})

	t.Run("malformed body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/sqrt", bytes.NewReader([]byte("{bad")))
		rec := httptest.NewRecorder()
		mux.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
		}
	})
}

func TestMalformedJSON(t *testing.T) {
	mux := NewMux()

	req := httptest.NewRequest(http.MethodPost, "/api/v1/add", bytes.NewReader([]byte("{not json")))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestUnknownField(t *testing.T) {
	mux := NewMux()
	rec := doRequest(t, mux, http.MethodPost, "/api/v1/add", map[string]any{"a": 1, "b": 2, "c": 3})

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestWrongMethod(t *testing.T) {
	mux := NewMux()
	rec := doRequest(t, mux, http.MethodGet, "/api/v1/add", nil)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
	}
}

func TestUnknownRoute(t *testing.T) {
	mux := NewMux()
	rec := doRequest(t, mux, http.MethodPost, "/api/v1/modulo", map[string]float64{"a": 1, "b": 2})

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

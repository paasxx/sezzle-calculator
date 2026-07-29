package api

import "net/http"

// withCORS lets the frontend (served from a different origin/port in dev,
// e.g. localhost:5173) call this API from the browser. Browsers block
// cross-origin fetches unless the response carries these headers, and send
// a preflight OPTIONS request first for anything beyond a "simple" request.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Handler returns the full application handler: routes wrapped with CORS
// support. Tests that don't care about CORS can keep using NewMux directly.
func Handler() http.Handler {
	return withCORS(NewMux())
}

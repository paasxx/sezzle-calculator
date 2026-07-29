// Command server starts the calculator HTTP API.
package main

import (
	"log"
	"net/http"

	"sezzle-calculator/backend/internal/api"
)

func main() {
	handler := api.Handler()

	const addr = ":8000"
	log.Printf("listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}

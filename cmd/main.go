package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

// Response struct để trả về JSON
type Response struct {
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Version   string    `json:"version"`
	Hostname  string    `json:"hostname"`
}

// Health check endpoint
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Uptime    string    `json:"uptime"`
}

var startTime = time.Now()

func main() {
	// Lấy port từ environment variable, mặc định là 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Serve static files from web directory
	webDir := filepath.Join(".", "web")
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir(webDir))))

	// Routes
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/api/info", infoHandler)

	// Log server start
	log.Printf("Server starting on port %s", port)
	log.Printf("Serving static files from: %s", webDir)
	log.Printf("Available endpoints:")
	log.Printf("  GET / - Home page (serving web/index.html)")
	log.Printf("  GET /static/ - Static files (CSS, JS, etc.)")
	log.Printf("  GET /health - Health check")
	log.Printf("  GET /api/info - API info")

	// Start server
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

// Home handler - serves the index.html from web directory
func homeHandler(w http.ResponseWriter, r *http.Request) {
	// Only serve the root path, let other paths be handled by static file server if needed
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	// Serve the index.html file from web directory
	indexPath := filepath.Join("web", "index.html")
	http.ServeFile(w, r, indexPath)
}

// Health check handler
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	uptime := time.Since(startTime)
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Uptime:    uptime.String(),
	}

	json.NewEncoder(w).Encode(response)
}

// API info handler
func infoHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	hostname, _ := os.Hostname()
	response := Response{
		Message:   "Go Test Deploy API is running!",
		Timestamp: time.Now(),
		Version:   "1.0.0",
		Hostname:  hostname,
	}

	json.NewEncoder(w).Encode(response)
}

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
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

	// Routes
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/api/info", infoHandler)

	// Log server start
	log.Printf("Server starting on port %s", port)
	log.Printf("Available endpoints:")
	log.Printf("  GET / - Home page")
	log.Printf("  GET /health - Health check")
	log.Printf("  GET /api/info - API info")

	// Start server
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

// Home handler
func homeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	html := `
<!DOCTYPE html>
<html>
<head>
    <title>Go Test Deploy App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #007bff; }
        .method { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Go Test Deploy App</h1>
        <p>Chào mừng đến với ứng dụng Go test deploy!</p>
        
        <h2>Available Endpoints:</h2>
        <div class="endpoint">
            <span class="method">GET</span> <code>/</code> - Trang chủ này
        </div>
        <div class="endpoint">
            <span class="method">GET</span> <code>/health</code> - Health check
        </div>
        <div class="endpoint">
            <span class="method">GET</span> <code>/api/info</code> - Thông tin API
        </div>
        
        <p><a href="/health">Check Health</a> | <a href="/api/info">API Info</a></p>
    </div>
</body>
</html>`
	fmt.Fprint(w, html)
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

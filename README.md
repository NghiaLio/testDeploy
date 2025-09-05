# Go Test Deploy App

Ứng dụng Go đơn giản để test deploy với các endpoint cơ bản.

## Tính năng

- HTTP server đơn giản
- 3 endpoints: `/`, `/health`, `/api/info`
- Hỗ trợ Docker containerization
- Health check endpoint
- JSON API responses

## Cấu trúc dự án

```
.
├── main.go          # Ứng dụng chính
├── go.mod           # Go module file
├── Dockerfile       # Docker configuration
├── .dockerignore    # Docker ignore file
└── README.md        # Documentation
```

## Chạy local

### Yêu cầu
- Go 1.21 hoặc cao hơn

### Cách chạy

1. Clone repository:
```bash
git clone <your-repo-url>
cd testDeploy
```

2. Chạy ứng dụng:
```bash
go run main.go
```

3. Mở browser và truy cập: http://localhost:8080

## Deploy với Docker

### Build Docker image

```bash
docker build -t testdeploy-app .
```

### Chạy container

```bash
docker run -p 8080:8080 testdeploy-app
```

### Với environment variables

```bash
docker run -p 8080:8080 -e PORT=8080 testdeploy-app
```

## Deploy lên các platform

### 1. Heroku

1. Tạo file `Procfile`:
```
web: ./main
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### 2. Railway

1. Kết nối GitHub repository
2. Railway sẽ tự động detect Go app và deploy

### 3. Google Cloud Run

```bash
# Build và push image
gcloud builds submit --tag gcr.io/PROJECT-ID/testdeploy

# Deploy
gcloud run deploy --image gcr.io/PROJECT-ID/testdeploy --platform managed
```

### 4. AWS ECS/Fargate

1. Push image lên ECR
2. Tạo task definition
3. Deploy service

### 5. DigitalOcean App Platform

1. Kết nối GitHub repository
2. Chọn Go runtime
3. Deploy

## API Endpoints

### GET /
Trang chủ với HTML interface

### GET /health
Health check endpoint trả về JSON:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": "1h30m45s"
}
```

### GET /api/info
API info endpoint trả về JSON:
```json
{
  "message": "Go Test Deploy API is running!",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "hostname": "container-hostname"
}
```

## Environment Variables

- `PORT`: Port để chạy server (mặc định: 8080)

## Development

### Chạy với hot reload (cần install air):
```bash
go install github.com/cosmtrek/air@latest
air
```

### Test endpoints:
```bash
# Health check
curl http://localhost:8080/health

# API info
curl http://localhost:8080/api/info
```

## Troubleshooting

### Port đã được sử dụng
```bash
# Tìm process đang sử dụng port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Docker build fails
- Kiểm tra Dockerfile syntax
- Đảm bảo go.mod file tồn tại
- Check Docker daemon đang chạy

### Deploy fails
- Kiểm tra environment variables
- Verify port configuration
- Check platform-specific requirements
# testDeploy

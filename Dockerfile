# Stage 1: build binary
FROM golang:1.21 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app ./cmd

# Stage 2: runtime
FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/app .
COPY --from=builder /app/web ./web
EXPOSE 8080
CMD ["./app"]

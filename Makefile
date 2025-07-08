# GitHub Repository Manager Makefile

.PHONY: help setup backend frontend dev clean test test-ui test-headed install-browsers docker-build docker-dev docker-prod docker-down docker-logs docker-clean

# Default target
help:
	@echo "Available commands:"
	@echo "  setup     - Install dependencies for both backend and frontend"
	@echo "  backend   - Run the Go backend server"
	@echo "  frontend  - Run the Next.js frontend development server"
	@echo "  dev       - Run both backend and frontend in parallel"
	@echo "  clean     - Clean build artifacts and dependencies"
	@echo "  test      - Run tests for both backend and frontend"
	@echo "  test-ui   - Run frontend tests with Playwright UI"
	@echo "  test-headed - Run frontend tests in headed mode"
	@echo "  install-browsers - Install Playwright browsers"
	@echo ""
	@echo "Docker commands:"
	@echo "  docker-build - Build Docker images"
	@echo "  docker-dev   - Run development environment with Docker"
	@echo "  docker-prod  - Run production environment with Docker"
	@echo "  docker-down  - Stop Docker containers"
	@echo "  docker-logs  - View Docker container logs"
	@echo "  docker-clean - Clean Docker resources and volumes"

# Setup dependencies
setup:
	@echo "Setting up backend dependencies..."
	cd backend && go mod tidy
	@echo "Setting up frontend dependencies..."
	cd frontend && npm install
	@echo "Setup complete!"

# Run backend
backend:
	@echo "Starting Go backend server..."
	cd backend && go run main.go

# Run frontend
frontend:
	@echo "Starting Next.js frontend development server..."
	cd frontend && npm run dev

# Run both backend and frontend
dev:
	@echo "Starting both backend and frontend..."
	@make -j2 backend frontend

# Clean build artifacts
clean:
	@echo "Cleaning backend..."
	cd backend && go clean
	@echo "Cleaning frontend..."
	cd frontend && rm -rf .next node_modules
	@echo "Clean complete!"

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && go test ./...
	@echo "Running frontend tests..."
	cd frontend && npm run test

# Run frontend tests with UI
test-ui:
	@echo "Running frontend tests with UI..."
	cd frontend && npm run test:ui

# Run frontend tests in headed mode
test-headed:
	@echo "Running frontend tests in headed mode..."
	cd frontend && npm run test:headed

# Install Playwright browsers
install-browsers:
	@echo "Installing Playwright browsers..."
	cd frontend && npx playwright install

# Build for production
build:
	@echo "Building backend..."
	cd backend && go build -o bin/server main.go
	@echo "Building frontend..."
	cd frontend && npm run build
	@echo "Build complete!"

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose build
	@echo "Docker images built successfully!"

docker-dev:
	@echo "Starting development environment with Docker..."
	docker-compose -f docker-compose.dev.yml up --build

docker-prod:
	@echo "Starting production environment with Docker..."
	docker-compose up --build -d
	@echo "Production environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8080"

docker-down:
	@echo "Stopping Docker containers..."
	docker-compose down
	docker-compose -f docker-compose.dev.yml down
	@echo "Docker containers stopped!"

docker-logs:
	@echo "Viewing Docker container logs..."
	docker-compose logs -f

docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v --remove-orphans
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	@echo "Docker cleanup complete!"
#!/bin/bash

# Comprehensive Test Suite Runner
# This script runs all types of tests for the tournament voting system

set -e

echo "🚀 Starting Comprehensive Test Suite for Tournament Voting System"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required dependencies are installed
print_status "Checking dependencies..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

if ! npm list @playwright/test &> /dev/null; then
    print_error "Playwright is not installed. Run: npm install --save-dev @playwright/test"
    exit 1
fi

print_success "Dependencies check passed"

# Run unit tests
print_status "Running Unit Tests..."
echo "----------------------------------------"

if npm run test:unit; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

echo ""

# Run integration tests
print_status "Running Integration Tests..."
echo "----------------------------------------"

if npm run test:integration; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

echo ""

# Check if development server is running
print_status "Checking if development server is running..."

if curl -s http://localhost:3000 > /dev/null; then
    print_success "Development server is running"
    SERVER_RUNNING=true
else
    print_warning "Development server is not running. Starting server..."
    npm run dev &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null; then
            print_success "Development server started"
            break
        fi
        sleep 2
        if [ $i -eq 30 ]; then
            print_error "Server failed to start within 60 seconds"
            kill $SERVER_PID 2>/dev/null || true
            exit 1
        fi
    done
fi

echo ""

# Run E2E tests
print_status "Running End-to-End Tests..."
echo "----------------------------------------"

if npm run test:e2e; then
    print_success "E2E tests passed"
    E2E_SUCCESS=true
else
    print_error "E2E tests failed"
    E2E_SUCCESS=false
fi

# Stop server if we started it
if [ "$SERVER_RUNNING" = false ]; then
    print_status "Stopping development server..."
    kill $SERVER_PID 2>/dev/null || true
    print_success "Development server stopped"
fi

echo ""
echo "=================================================================="

if [ "$E2E_SUCCESS" = true ]; then
    print_success "🎉 All tests passed! The tournament voting system is working correctly."
    echo ""
    echo "Test Summary:"
    echo "✅ Unit Tests: PASSED"
    echo "✅ Integration Tests: PASSED"
    echo "✅ End-to-End Tests: PASSED"
    echo ""
    echo "The following areas have been thoroughly tested:"
    echo "• Player voting workflow"
    echo "• Admin poll management"
    echo "• Authentication flows"
    echo "• Performance characteristics"
    echo "• Accessibility compliance"
    echo "• Security measures"
    echo ""
    exit 0
else
    print_error "❌ Some tests failed. Please check the output above for details."
    echo ""
    echo "Test Summary:"
    echo "✅ Unit Tests: PASSED"
    echo "✅ Integration Tests: PASSED"
    echo "❌ End-to-End Tests: FAILED"
    echo ""
    exit 1
fi
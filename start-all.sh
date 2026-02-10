#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} Code Guardian - Starting All Services  ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✓${NC} $service is already running on port $port"
        return 0
    else
        return 1
    fi
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}✗ Node.js not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

if ! command_exists python3; then
    echo -e "${RED}✗ Python3 not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Python found: $(python3 --version)"

if ! command_exists mongod; then
    echo -e "${RED}✗ MongoDB not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} MongoDB found"

if ! command_exists redis-server; then
    echo -e "${RED}✗ Redis not found. Please install it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Redis found"

echo ""

# Start MongoDB
echo -e "${YELLOW}Starting MongoDB...${NC}"
if check_service "MongoDB" 27017; then
    echo -e "${YELLOW}Skipping MongoDB startup${NC}"
else
    brew services start mongodb-community 2>/dev/null || {
        mongod --config /usr/local/etc/mongod.conf --fork 2>/dev/null || {
            echo -e "${YELLOW}Starting MongoDB with default settings...${NC}"
            mkdir -p ./data/db
            mongod --dbpath=./data/db --fork --logpath=./data/mongodb.log
        }
    }
    sleep 2
    if check_service "MongoDB" 27017; then
        echo -e "${GREEN}✓${NC} MongoDB started successfully"
    else
        echo -e "${RED}✗ Failed to start MongoDB${NC}"
        exit 1
    fi
fi

echo ""

# Start Redis
echo -e "${YELLOW}Starting Redis...${NC}"
if check_service "Redis" 6379; then
    echo -e "${YELLOW}Skipping Redis startup${NC}"
else
    brew services start redis 2>/dev/null || {
        redis-server --daemonize yes
    }
    sleep 2
    if check_service "Redis" 6379; then
        echo -e "${GREEN}✓${NC} Redis started successfully"
    else
        echo -e "${RED}✗ Failed to start Redis${NC}"
        exit 1
    fi
fi

echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Warning: .env file not found. Using default values.${NC}"
fi

# Start Backend
echo -e "${YELLOW}Starting Backend (NestJS)...${NC}"
cd src/server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Kill existing backend process on port 3000
if check_service "Backend" 3000; then
    echo -e "${YELLOW}Stopping existing backend...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo -e "${YELLOW}Starting backend in background...${NC}"
npm run start:dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../../.backend.pid

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to start...${NC}"
for i in {1..30}; do
    if check_service "Backend" 3000; then
        echo -e "${GREEN}✓${NC} Backend started successfully (PID: $BACKEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start. Check logs/backend.log${NC}"
        exit 1
    fi
    sleep 1
done

cd ../..
echo ""

# Start Frontend
echo -e "${YELLOW}Starting Frontend (React + Vite)...${NC}"
cd src/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Kill existing frontend process on port 5173
if check_service "Frontend" 5173; then
    echo -e "${YELLOW}Stopping existing frontend...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo -e "${YELLOW}Starting frontend in background...${NC}"
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../.frontend.pid

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to start...${NC}"
for i in {1..30}; do
    if check_service "Frontend" 5173; then
        echo -e "${GREEN}✓${NC} Frontend started successfully (PID: $FRONTEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Frontend failed to start. Check logs/frontend.log${NC}"
        exit 1
    fi
    sleep 1
done

cd ../..
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All Services Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Services:${NC}"
echo -e "  • MongoDB:  ${GREEN}http://localhost:27017${NC}"
echo -e "  • Redis:    ${GREEN}http://localhost:6379${NC}"
echo -e "  • Backend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  • Frontend: ${GREEN}http://localhost:5173${NC}"

echo -e "\n${BLUE}Logs:${NC}"
echo -e "  • Backend:  ${YELLOW}tail -f logs/backend.log${NC}"
echo -e "  • Frontend: ${YELLOW}tail -f logs/frontend.log${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Open ${GREEN}http://localhost:5173${NC} in your browser"
echo -e "  2. Register a new account or login"
echo -e "  3. Add a repository and start analysis"

echo -e "\n${YELLOW}To stop all services, run:${NC} ${GREEN}./stop-all.sh${NC}\n"

# Keep script running and show logs
echo -e "${BLUE}Showing backend logs (Ctrl+C to exit):${NC}"
tail -f logs/backend.log

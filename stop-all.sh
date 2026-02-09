#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Code Guardian - Stopping All Services${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Stop Frontend
if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    echo -e "${YELLOW}Stopping Frontend (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✓${NC} Frontend stopped" || echo -e "${YELLOW}Frontend not running${NC}"
    rm .frontend.pid
else
    echo -e "${YELLOW}Stopping Frontend...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓${NC} Frontend stopped" || echo -e "${YELLOW}Frontend not running${NC}"
fi

# Stop Backend
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    echo -e "${YELLOW}Stopping Backend (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✓${NC} Backend stopped" || echo -e "${YELLOW}Backend not running${NC}"
    rm .backend.pid
else
    echo -e "${YELLOW}Stopping Backend...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null && echo -e "${GREEN}✓${NC} Backend stopped" || echo -e "${YELLOW}Backend not running${NC}"
fi

# Ask to stop MongoDB and Redis
echo ""
read -p "$(echo -e ${YELLOW}Do you want to stop MongoDB and Redis? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Stopping Redis...${NC}"
    brew services stop redis 2>/dev/null || redis-cli shutdown 2>/dev/null
    echo -e "${GREEN}✓${NC} Redis stopped"

    echo -e "${YELLOW}Stopping MongoDB...${NC}"
    brew services stop mongodb-community 2>/dev/null || mongosh admin --eval "db.shutdownServer()" 2>/dev/null
    echo -e "${GREEN}✓${NC} MongoDB stopped"
else
    echo -e "${YELLOW}Keeping MongoDB and Redis running${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All Services Stopped${NC}"
echo -e "${GREEN}========================================${NC}\n"

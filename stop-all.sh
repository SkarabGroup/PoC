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

# Check for docker compose
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ Docker Compose not found.${NC}"
    exit 1
fi

# Stop and remove containers
echo -e "${YELLOW}Stopping all containers...${NC}"
$COMPOSE_CMD down

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ All services stopped.${NC}"
else
    echo -e "\n${RED}✗ Error stopping services.${NC}"
    exit 1
fi

echo ""

# Ask if user wants to remove volumes (database data)
read -p "$(echo -e ${YELLOW}Do you want to remove database data \(volumes\)? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing volumes...${NC}"
    $COMPOSE_CMD down -v
    echo -e "${GREEN}✓ Volumes removed.${NC}"
else
    echo -e "${YELLOW}Keeping database data.${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All Services Stopped${NC}"
echo -e "${GREEN}========================================${NC}\n"

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

# ── Check the only prerequisite: Docker ──────────────────
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &>/dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker Desktop:${NC}"
    echo -e "  https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker found: $(docker --version)"

# Verify Docker daemon is running
if ! docker info &>/dev/null; then
    echo -e "${RED}✗ Docker daemon is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker daemon is running"

# Check for docker compose (v2)
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}✗ Docker Compose not found. Please install it.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker Compose found: $($COMPOSE_CMD version --short 2>/dev/null || $COMPOSE_CMD version)"

echo ""

# ── Build and start all containers ───────────────────────
echo -e "${YELLOW}Building and starting all services...${NC}"
echo -e "${YELLOW}(This may take a few minutes on first run)${NC}\n"

$COMPOSE_CMD up --build -d

if [ $? -ne 0 ]; then
    echo -e "\n${RED}✗ Failed to start services. Check the output above.${NC}"
    exit 1
fi

echo ""

# ── Wait for services to be healthy ──────────────────────
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for MongoDB
echo -ne "  MongoDB:  "
for i in {1..30}; do
    if docker compose ps mongodb 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}✓ ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ still starting (check logs)${NC}"
    fi
    sleep 1
done

# Wait for Redis
echo -ne "  Redis:    "
for i in {1..30}; do
    if docker compose ps redis 2>/dev/null | grep -q "healthy"; then
        echo -e "${GREEN}✓ ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ still starting (check logs)${NC}"
    fi
    sleep 1
done

# Wait for API
echo -ne "  API:      "
for i in {1..60}; do
    if curl -s http://localhost:3000/health &>/dev/null || curl -s http://localhost:3000/ &>/dev/null; then
        echo -e "${GREEN}✓ ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}⚠ still starting (check: $COMPOSE_CMD logs api)${NC}"
    fi
    sleep 1
done

# Wait for Frontend
echo -ne "  Frontend: "
for i in {1..60}; do
    if curl -s http://localhost:5173/ &>/dev/null; then
        echo -e "${GREEN}✓ ready${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${YELLOW}⚠ still starting (check: $COMPOSE_CMD logs frontend)${NC}"
    fi
    sleep 1
done

echo ""

# ── Summary ──────────────────────────────────────────────
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All Services Started Successfully!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Services:${NC}"
echo -e "  • MongoDB:  ${GREEN}mongodb://localhost:27017${NC}"
echo -e "  • Redis:    ${GREEN}localhost:6379${NC}"
echo -e "  • Backend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  • Frontend: ${GREEN}http://localhost:5173${NC}"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "  • View all logs:     ${YELLOW}$COMPOSE_CMD logs -f${NC}"
echo -e "  • View API logs:     ${YELLOW}$COMPOSE_CMD logs -f api${NC}"
echo -e "  • View frontend:     ${YELLOW}$COMPOSE_CMD logs -f frontend${NC}"
echo -e "  • View agents:       ${YELLOW}$COMPOSE_CMD logs -f agents${NC}"
echo -e "  • Service status:    ${YELLOW}$COMPOSE_CMD ps${NC}"
echo -e "  • Restart a service: ${YELLOW}$COMPOSE_CMD restart <service>${NC}"

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Open ${GREEN}http://localhost:5173${NC} in your browser"
echo -e "  2. Register a new account or login"
echo -e "  3. Add a repository and start analysis"

echo -e "\n${YELLOW}To stop all services, run:${NC} ${GREEN}./stop-all.sh${NC}\n"

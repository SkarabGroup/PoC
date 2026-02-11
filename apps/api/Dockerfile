FROM node:20-alpine

# Install git (needed to clone repos for analysis)
RUN apk add --no-cache git python3 py3-pip docker-cli

WORKDIR /app

# Copy package files and install dependencies
COPY apps/api/package*.json ./
RUN npm install

# Copy source code
COPY apps/api/ .

# Build the NestJS app
RUN npm run build

EXPOSE 3000

# In dev mode use start:dev for hot reload; in prod use start:prod
CMD ["npm", "run", "start:dev"]
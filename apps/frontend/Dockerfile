FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY apps/frontend/package*.json ./
RUN npm install

# Copy source code
COPY apps/frontend/ .

EXPOSE 5173

# Vite dev server needs --host to be accessible outside the container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
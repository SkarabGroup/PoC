FROM node:20-alpine

RUN apk add --no-cache git python3 py3-pip docker-cli

WORKDIR /app

COPY ./package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]

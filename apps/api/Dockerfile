FROM node:20-alpine
WORKDIR /app
# I percorsi qui partono dalla root del progetto grazie al context nel compose
COPY apps/api/package*.json ./
RUN npm install
COPY apps/api/ .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
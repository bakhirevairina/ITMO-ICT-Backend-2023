FROM node:18.12.0-alpine
WORKDIR /app/events
COPY package*.json ./
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]

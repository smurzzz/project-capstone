FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json if available
COPY package*.json ./

RUN npm install --production

COPY . .

WORKDIR /usr/src/app/server

EXPOSE 5000

CMD ["node", "index.js"]

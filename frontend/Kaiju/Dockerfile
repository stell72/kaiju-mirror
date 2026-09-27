FROM node:22-alpine3.21

WORKDIR /frontend/Kaiju

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
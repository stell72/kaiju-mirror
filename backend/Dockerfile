FROM node:22-alpine3.21

WORKDIR /backend

COPY package*.json ./
RUN npm install

COPY . .

#RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "run", "dev"]
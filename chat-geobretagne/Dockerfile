FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY config ./config
COPY src ./src
USER node
EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]

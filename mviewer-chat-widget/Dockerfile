FROM node:22-alpine AS builder
ARG BASE_PATH=/mcp/chat
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN VITE_BASE_PATH=${BASE_PATH} npm run build

FROM nginx:alpine
ARG BASE_PATH=/mcp/chat
ENV BASE_PATH=${BASE_PATH}
COPY --from=builder /app/dist /usr/share/nginx/html${BASE_PATH}
COPY nginx.conf /etc/nginx/nginx.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${BASE_PATH}' < /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

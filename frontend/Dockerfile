# Estágio 1: Build da aplicação React + Vite com Node 22 LTS
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx leve para servir a SPA na porta 5173
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]

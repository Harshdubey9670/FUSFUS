# Stage 1: Build Frontend
FROM node:20-alpine AS build-stage
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS production-stage
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production
COPY server/ ./server/
COPY --from=build-stage /app/client/dist ./server/public

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000
CMD ["node", "server/src/server.js"]

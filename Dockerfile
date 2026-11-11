FROM node:22-bookworm-slim AS frontend-builder
WORKDIR /app/smart-salary-tracker/frontend
COPY smart-salary-tracker/frontend/package*.json ./
RUN npm install --no-audit --no-fund
COPY smart-salary-tracker/frontend/ ./
ARG VITE_API_URL=/api
ARG VITE_ENABLE_DEMO_LOGIN=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ENABLE_DEMO_LOGIN=$VITE_ENABLE_DEMO_LOGIN
RUN npm run build

FROM node:22-bookworm-slim AS backend-builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app/smart-salary-tracker/backend
COPY smart-salary-tracker/backend/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim
WORKDIR /app/smart-salary-tracker/backend
ENV NODE_ENV=production
COPY --from=backend-builder /app/smart-salary-tracker/backend/node_modules ./node_modules
COPY smart-salary-tracker/backend/ ./
COPY --from=frontend-builder /app/smart-salary-tracker/frontend/dist /app/smart-salary-tracker/frontend/dist

EXPOSE 5000
CMD ["node", "server.js"]

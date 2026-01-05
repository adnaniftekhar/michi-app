# ---- Base image ----
FROM node:18-slim

# ---- Set working directory ----
WORKDIR /app

# ---- Install dependencies ----
COPY package.json package-lock.json* ./
RUN npm install

# ---- Copy source ----
COPY . .

# ---- Build Next.js ----
RUN npm run build

# ---- Expose port ----
EXPOSE 8080

# ---- Start app ----
ENV PORT=8080
CMD ["npm", "start"]

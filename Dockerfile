# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

# Cài dependency trước để tận dụng cache layer
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile; \
    else \
      npm ci; \
    fi

COPY . .
RUN npm run build

# ---- Stage 2: Serve bằng Nginx ----
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

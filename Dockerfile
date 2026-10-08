# ==========================================
# Stage 1: Build Frontend SPA
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Production Container
# ==========================================
FROM node:22-bullseye-slim AS runner

# Install Python and runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Python Virtual Environment and Install ML Dependencies
RUN python3 -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY ml/requirements.txt ./ml/requirements.txt
RUN pip install --no-cache-dir -r ml/requirements.txt

# Install Node Production Dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy Application Backend, ML Models, and Static Frontend Bundle
COPY server/ ./server/
COPY ml/ ./ml/
COPY scripts/ ./scripts/
COPY src/services/notificationService.js ./src/services/notificationService.js
COPY --from=frontend-builder /app/dist ./dist

# Create Sandbox, Quarantine, and SQLite persistent directories
RUN mkdir -p /app/monitored_sandbox /app/quarantine /app/data && chmod +x ./scripts/start-production.sh

# Environment Configuration
ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0 \
    ML_SERVICE_URL=http://127.0.0.1:5001 \
    SANDBOX_DIR=/app/monitored_sandbox \
    QUARANTINE_DIR=/app/quarantine \
    DB_PATH=/app/data/cryptsentinel.db

EXPOSE 8000
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["./scripts/start-production.sh"]

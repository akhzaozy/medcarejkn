FROM node:24-alpine
RUN apk add --no-cache postgresql-client
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY shared/ /app/shared/
COPY config/ /app/config/
COPY database/migrations/ /app/database/migrations/
COPY data/demo/ /app/data/demo/
COPY data/benchmark/ /app/data/benchmark/
COPY outputs/bpjs-2025/analysis.json outputs/bpjs-2025/bpjs-patients.sqlite outputs/bpjs-2025/patient-index.json outputs/bpjs-2025/BPJS_2025_Analisis.xlsx /app/bpjs-data/
ENV BPJS_DATA_DIR=/app/bpjs-data
ENV BPJS_AUDIT_DIR=/app/bpjs-audit
ENV JKN_BACKUP_DIR=/app/backups
EXPOSE 3000
CMD ["node", "src/server.js"]

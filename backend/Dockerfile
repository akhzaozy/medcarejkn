FROM node:24-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ ./
# Keep the demo index inside the image so a clean deployment has patient data.
COPY outputs/bpjs-2025/analysis.json outputs/bpjs-2025/bpjs-patients.sqlite outputs/bpjs-2025/patient-index.json outputs/bpjs-2025/BPJS_2025_Analisis.xlsx ./bpjs-data/
ENV BPJS_DATA_DIR=/app/bpjs-data
ENV BPJS_AUDIT_DIR=/app/bpjs-audit

EXPOSE 3000

CMD ["node", "src/server.js"]

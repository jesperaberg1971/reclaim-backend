FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache dumb-init \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    UPLOADS_DIR=/tmp/uploads

COPY package*.json ./
RUN npm ci --omit=dev

ARG CACHE_BUST=20260611-1132
COPY dist ./dist

RUN mkdir -p /tmp/uploads/receipts /tmp/uploads/trip-decisions /tmp/uploads/invoices \
    && chown -R appuser:appgroup /tmp/uploads

USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

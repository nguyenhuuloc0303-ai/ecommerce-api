FROM node:20-alpine

WORKDIR /usr/src/app

# Install curl and wget for health checks
RUN apk add --no-cache wget curl

COPY package*.json ./

RUN npm install

COPY prisma ./prisma/

RUN npx prisma generate

COPY src ./src/

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["sh", "-c", "npx prisma db push && node src/server.js"]

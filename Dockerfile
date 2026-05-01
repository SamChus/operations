# 1. Ensure 'AS builder' is here (no spaces or typos)
FROM node:24-alpine AS builder

WORKDIR /home/app
COPY server/package.json ./
RUN npm install
COPY . .

# --- Second Stage ---
FROM node:24-alpine

WORKDIR /home/app

# 2. This must match the name used after 'AS' exactly
COPY --from=builder /home/app/node_modules ./node_modules
COPY --from=builder /home/app/server ./server
COPY --from=builder /home/app/package.json ./

USER node
CMD [ "node", "server/index.js" ]
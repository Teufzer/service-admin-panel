FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies (including devDeps for TypeScript)
COPY package.json bun.lockb ./
RUN bun install

# Copy all source
COPY . .

# Build server TypeScript (exactly like build:server script)
RUN cd server && rm -rf .build && ../node_modules/.bin/tsc && cd ..

# Build Next.js client
RUN bun run build:client

FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/revolt.crt ./revolt.crt
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "start"]

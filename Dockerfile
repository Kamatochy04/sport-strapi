FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337

RUN npm run build

RUN mkdir -p .tmp

EXPOSE 1337

CMD ["npm", "run", "start"]

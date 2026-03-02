FROM node:20-bookworm-slim

WORKDIR /app

# Runtime dependencies for media downloads/transcoding.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 python3-pip ca-certificates \
  && pip3 install --break-system-packages --no-cache-dir yt-dlp \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000
ENV DOWNLOAD_DIR=/tmp/unidl

EXPOSE 10000

CMD ["npm", "run", "start"]

# syntax=docker/dockerfile:1

# Use the official Node.js v24 base image
# We use the slim variant to keep the image size smaller while still having essential tools
ARG NODE_VERSION=24
FROM node:${NODE_VERSION}-slim AS base

# Configure pnpm installation directory and ensure it is on PATH
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HOME="/app"

# Install ca-certificates (the system CA bundle used for TLS), then clean
# the apt cache. Required by the LiveKit SDK: the native Rust core reads
# the system trust store at runtime, which the slim base image doesn't ship.
# --no-install-recommends keeps the image minimal.
RUN apt-get update -qq && apt-get install --no-install-recommends -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Pin pnpm version for reproducible builds
RUN npm install -g pnpm@10

# Create a non-privileged user that the app will run under
# See https://docs.docker.com/build/building/best-practices/#user
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/app" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

WORKDIR /app

# The TypeScript agent is typechecked and bundled before this build. The image
# receives only the JavaScript bundle and production dependencies.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# The standalone CLI discovers installed @livekit/agents-plugin-* packages
# without loading the agent entrypoint.
RUN npx livekit-agents download-files

COPY --chown=appuser:appuser dist ./dist

USER appuser

# Set Node.js to production mode
ENV NODE_ENV=production

# Run the compiled worker. No TypeScript or Next.js source is present here.
CMD [ "node", "dist/main.js", "start" ]

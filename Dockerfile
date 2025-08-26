###########################################
# Build Stage 1: Build the Verifier
###########################################
FROM ubuntu:24.04 as verifier-builder

ARG VERIFIER_URL="http://localhost:7047"

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
        curl \
        git \
        bash \
        ca-certificates \
        pkg-config \
        libssl-dev \
        build-essential \
        npm \
        sudo \
        && rm -rf /var/lib/apt/lists/*

# Install Rust and Cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Install xtp and Extism
RUN curl https://static.dylibso.com/cli/install.sh -s | bash
RUN curl https://raw.githubusercontent.com/extism/js-pdk/main/install.sh -s | bash
ENV PATH="/root/.xtp/bin:$PATH"

# Clone and build TLSNotary (interactive-verifier branch)
WORKDIR /
RUN git clone --branch interactive-verifier --single-branch https://github.com/tlsnotary/tlsn.git

# Build the Verifier plugin
WORKDIR /tlsn/crates/notary/plugin/js
RUN chmod +x prepare.sh && ./prepare.sh && xtp plugin build

# Build the Verifier server
WORKDIR /tlsn/crates/notary/server
RUN cargo build --release

# Build the prover plugin
WORKDIR /
RUN git clone --branch interactive-verifier --single-branch https://github.com/tlsnotary/tlsn-plugin-boilerplate.git
WORKDIR /tlsn-plugin-boilerplate
# replace "http://localhost:7047" with $VERIFIER_URL in config.json and src/index.ts
RUN sed -i "s|http://localhost:7047|$VERIFIER_URL|g" config.json src/index.ts
RUN npm ci; npm run build

###########################################
# Build stage 2: Build the demo application
###########################################
FROM node:18-slim AS demo-builder

ARG ENABLE_POAP=false

ENV POAP=${ENABLE_POAP}

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=verifier-builder /tlsn-plugin-boilerplate/dist/*.tlsn.wasm ./static
RUN npm run build

###########################################
# Build Stage 3: Runtime
###########################################
FROM node:18-slim AS production

ARG ENABLE_POAP=false
ENV POAP=${ENABLE_POAP}

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates netcat-openbsd && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN addgroup --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid 1001 --no-create-home nodejs

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=demo-builder --chown=nodejs:nodejs /app/build ./build

WORKDIR /verifier
COPY --from=verifier-builder /tlsn/target/release/notary-server ./verifier
COPY --from=verifier-builder /tlsn/crates/notary/plugin/wasm/*.wasm /plugin/wasm/

# Install PM2 for process management
RUN npm install -g pm2
COPY ecosystem.config.js /ecosystem.config.js

EXPOSE 3030 7047

ENV VERIFIER_SECRET_KEY="TMBak7!!66ku$kRQ"

CMD ["pm2-runtime", "/ecosystem.config.js"]
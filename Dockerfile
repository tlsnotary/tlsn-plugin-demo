FROM node:latest

ARG PORT=3030
WORKDIR /app
ENV PATH="${PATH}:/root/.cargo/bin"

COPY . .

RUN apt-get update && apt-get install -y curl && apt-get install netcat-openbsd -y
RUN curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y
RUN npm install
RUN npm run build

EXPOSE ${PORT}
CMD ["node", "build/server/index.bundle.js"]

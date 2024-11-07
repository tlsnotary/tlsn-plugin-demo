FROM node:20-alpine

ARG PORT=3030
WORKDIR /app

COPY . .

RUN curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y
RUN npm install
RUN npm i --prefix rs/0.1.0-alpha.7/
RUN touch server/util/poaps.txt
RUN touch server/util/assignments.json
RUN npm run build

EXPOSE ${PORT}
CMD ["node", "build/server/index.bundle.js"]

FROM node:20-alpine

ARG PORT=3030
WORKDIR /app

COPY . .

RUN npm install
RUN touch server/util/poaps.txt
RUN touch server/util/assignments.json
RUN npm run build

EXPOSE ${PORT}
CMD ["node", "build/server/index.bundle.js"]

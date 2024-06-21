# Setup node
FROM node:latest AS BUILD

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src
COPY index.html ./
COPY tsconfig.json ./
COPY rollup.config.js ./

RUN npm run build


FROM node:latest AS RUN

WORKDIR /app

COPY --from=BUILD /app/dist ./dist
COPY --from=BUILD /app/index.html ./
COPY --from=BUILD /app/tsconfig.json ./
COPY --from=BUILD /app/rollup.config.js ./
COPY --from=BUILD /app/package*.json ./
COPY --from=BUILD /app/node_modules ./node_modules

EXPOSE 8080

CMD [ "npm", "run", "start", "--", "--port", "8080" ]

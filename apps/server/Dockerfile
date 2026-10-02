FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/client/package.json apps/client/package.json
COPY apps/server/package.json apps/server/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY tsconfig.base.json ./
COPY apps/server apps/server
COPY packages/shared packages/shared
RUN npm run build -w @pixel-dice-duel/shared && npm run build -w @pixel-dice-duel/server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/package.json apps/server/package.json
COPY --from=build /app/apps/server/dist apps/server/dist
COPY --from=build /app/packages/shared/package.json packages/shared/package.json
COPY --from=build /app/packages/shared/dist packages/shared/dist
EXPOSE 2567
CMD ["node", "apps/server/dist/index.js"]

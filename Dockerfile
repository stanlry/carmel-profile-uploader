FROM node:22-bullseye-slim as base

# Install all node_modules, including dev dependencies
FROM base as deps

RUN mkdir /app
WORKDIR /app

ADD package.json package-lock.json ./
RUN npm install --production=false


# Setup production node_modules
FROM base as production-deps

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
ADD package.json package-lock.json ./
RUN npm prune --production


# Build the app
FROM base as build

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD . .
RUN npm run build


# Final image
FROM base

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
ADD . .

EXPOSE 3000

CMD ["npm", "run", "start"]
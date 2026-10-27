# No default: CI passes --build-arg NODE_VERSION=$NODE_IMAGE_VERSION, the one Node
# version of hive/common-ci-configuration; a local build passes it the same way.
ARG NODE_VERSION

FROM node:${NODE_VERSION} as development

WORKDIR /var/app

# Empty (no --build-arg) means npm's default, the public registry.
ARG NPM_CONFIG_REGISTRY
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY}

COPY package.json package-lock.json .npmrc ./
COPY patches ./patches

RUN npm ci --no-audit --no-fund

COPY . .

RUN mkdir tmp && npm run build

CMD [ "npm", "run", "start" ]

### REMOVE DEV DEPENDENCIES ##
FROM development as dependencies

RUN npm prune --omit=dev --no-audit --no-fund

### BUILD MINIFIED PRODUCTION ##
FROM node:${NODE_VERSION}-alpine as production

WORKDIR /var/app

ARG SOURCE_COMMIT
ENV SOURCE_COMMIT ${SOURCE_COMMIT}
ARG DOCKER_TAG
ENV DOCKER_TAG ${DOCKER_TAG}

COPY --from=dependencies /var/app/package.json /var/app/package.json
COPY --from=dependencies /var/app/config /var/app/config
COPY --from=dependencies /var/app/dist /var/app/dist
COPY --from=dependencies /var/app/lib /var/app/lib
COPY --from=dependencies /var/app/src /var/app/src
COPY --from=dependencies /var/app/tmp /var/app/tmp
COPY --from=dependencies /var/app/webpack /var/app/webpack
COPY --from=dependencies /var/app/node_modules /var/app/node_modules

COPY --from=dependencies /var/app/healthcheck.js /var/app/healthcheck.js

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 CMD node /var/app/healthcheck.js

CMD [ "npm", "run", "production" ]

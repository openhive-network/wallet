# The image AIDEV runs this project's suites in (`environment.image` in
# .aidev/project.yaml). Suites run with `--network none` and the caller's uid, so
# everything they need is in the image:
#
# * common-ci-configuration's node-test-tools, the hive-wide Node (the one
#   NODE_VERSION of ccc's docker-bake.hcl) and its build tools; this file names
#   no Node version of its own;
# * yarn classic, and a yarn cache filled from yarn.lock (lifecycle scripts and
#   engine checks skipped, so the cache fills whatever the Node), so `yarn
#   install --offline --frozen-lockfile` works in the sandbox;
# * make and g++ (the base has python3), and node-gyp's Node headers for that Node
#   in /opt/node-gyp (npm_config_devdir),
#   so a native module's install script can build without a download.
#
# Build and pin it with .aidev/runtime/build.sh --push; see .aidev/README.md.
ARG BASE_IMAGE=registry.gitlab.syncad.com/hive/common-ci-configuration/node-test-tools:develop
FROM ${BASE_IMAGE}
USER root
ENV HOME=/tmp \
    YARN_CACHE_FOLDER=/opt/yarn-cache \
    npm_config_devdir=/opt/node-gyp \
    DISABLE_OPENCOLLECTIVE=1 \
    ADBLOCK=1 \
    HUSKY=0 \
    DO_NOT_TRACK=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends make g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && (command -v yarn >/dev/null || npm install -g --no-fund --no-audit yarn@1.22.22) \
    && yarn --version \
    && npx --yes node-gyp@11 install \
    && ls /opt/node-gyp
COPY package.json yarn.lock /tmp/deps/
RUN cd /tmp/deps \
    && yarn install --frozen-lockfile --ignore-scripts --ignore-engines --non-interactive \
    && cd / && rm -rf /tmp/deps /tmp/.npm /tmp/.cache \
    && chmod -R a+rwX /opt/yarn-cache /opt/node-gyp

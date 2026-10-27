# The image AIDEV runs this project's suites in (`environment.image` in
# .aidev/project.yaml). Suites run with `--network none` and the caller's uid, so
# everything they need is in the image:
#
# * common-ci-configuration's node-test-tools, the hive-wide Node (the one
#   NODE_VERSION of ccc's docker-bake.hcl) and its build tools; this file names
#   no Node version of its own;
# * an npm cache filled from package-lock.json (lifecycle scripts and engine
#   checks skipped, so the cache fills whatever the Node), plus a mirror of each
#   git dependency npm clones rather than downloads (any non-GitHub host), wired in
#   with a system git `insteadOf`, so `npm ci --offline` works in the sandbox;
# * make and g++ (the base has python3), and node-gyp's Node headers for that Node
#   in /opt/node-gyp (npm_config_devdir),
#   so a native module's install script can build without a download.
#
# Build and pin it with .aidev/runtime/build.sh --push; see .aidev/README.md.
ARG BASE_IMAGE=registry.gitlab.syncad.com/hive/common-ci-configuration/node-test-tools:develop
FROM ${BASE_IMAGE}
USER root
ENV HOME=/tmp \
    npm_config_cache=/opt/npm-cache \
    npm_config_devdir=/opt/node-gyp \
    DISABLE_OPENCOLLECTIVE=1 \
    ADBLOCK=1 \
    HUSKY=0 \
    DO_NOT_TRACK=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends make g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && npx --yes node-gyp@11 install \
    && ls /opt/node-gyp
# The npm registry the cache is filled from (build.sh passes the caller's); empty
# means the public one. Not an ENV: suites run offline.
ARG NPM_CONFIG_REGISTRY
COPY package.json package-lock.json .npmrc /tmp/deps/
RUN cd /tmp/deps \
    && npm ci --ignore-scripts --engine-strict=false --no-audit --no-fund \
    && for url in $(sed -n 's|.*"resolved": "git+\(https://[^"#]*\)#.*|\1|p' package-lock.json); do \
           mirror="/opt/git-mirrors/${url#https://}"; \
           git clone --quiet --mirror "$url" "$mirror" \
           && git config --system "url.file://$mirror.insteadOf" "$url" \
           && git config --system --add safe.directory "$mirror" || exit 1; \
       done \
    && cd / && rm -rf /tmp/deps /tmp/.npm /tmp/.cache \
    && mkdir -p /opt/git-mirrors \
    && chmod -R a+rwX /opt/npm-cache /opt/node-gyp /opt/git-mirrors

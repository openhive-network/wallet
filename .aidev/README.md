# Automated contributions

This directory configures the automated development platform that contributes to this
repository. This note says which branches it uses here and how its work reaches the
project's main line.

## Branches

- `aidev/integration` — the integration branch. Automated work lands here and nowhere else.
- `develop` — the project's main line; reached from `aidev/integration` only by merge request (`aidev handoff`). Merge it keeping the source branch (`aidev/integration` is protected, so GitLab will not delete it).
- `ai/*` — one branch per task, created and deleted by the platform. Do not commit to them.
- `session/*` — a session's accumulated work, landed on the integration branch as a batch.

## How work reaches the main line

Task and session branches never reach `aidev/integration` through merge requests; the platform
lands them after its own verification. `aidev/integration` reaches `develop` by this project's
usual process, merge requests included — the platform never merges into any other branch.

Whether this project's CI pipelines skip `ai/*` and `session/*` branches is decided by the
project's CI rules; maintainers record that decision here.

## Suites run before work lands

Declared in `.aidev/project.yaml` under `verification`, all through `.aidev/run-checks.sh`,
which writes `test-results/<slot>/junit.xml` (one case per step):

- `quick` — `.aidev/run-checks.sh quick test build`
- `full` — `.aidev/run-checks.sh full test build`
- `baseline` — `.aidev/run-checks.sh baseline test`
- `canary` — `.aidev/run-checks.sh canary test build`
- `static` — `.aidev/run-checks.sh static lint`
- `coverage` — `.aidev/run-checks.sh coverage test`
- `system` — `.aidev/run-checks.sh system test build`

Every run first installs `node_modules` offline from the image's yarn cache (`install`,
`yarn install --offline --frozen-lockfile` with lifecycle scripts). Steps: `test` is jest
(`ci:test`, CI's `run-unit-tests`) with coverage, `lint` is `eslint src/` (`ci:eslint`, CI's
`run-eslint`, which CI allows to fail), `build` is `yarn build` (webpack production bundle
and babel into `lib/`, the Dockerfile's build stage). There is no browser or e2e suite in
the slots: `blackboxtest/` needs Selenium and a running site.

Left out of every slot (`JEST_ALREADY_FAILING` in `run-checks.sh`):

- `src/app/utils/ProxifyUrl.test.js` — 6 of its tests fail on `develop` on Node 12.22.6
  as well as on Node 24; they appear to predate 7d7d7270, which moved ProxifyUrl's regex
  from steemitimages.com to images.hive.blog. Fixing them would bring the file back.

## Test runtime

`.aidev/runtime/Dockerfile` builds on common-ci-configuration's `node-test-tools:develop`,
which carries the hive-wide Node version (ccc's `NODE_VERSION`); this repository names no
Node version for it. It adds yarn classic, `make`/`g++`, node-gyp's headers for that Node
(`/opt/node-gyp`) and a yarn cache filled from `yarn.lock` (`/opt/yarn-cache`). Rebuild and
re-pin it with `.aidev/runtime/build.sh --push` when the Dockerfile, `package.json` or
`yarn.lock` changes, or ccc's image moves, and put the printed `repo@sha256:…` into
`environment.image`.

## Known state at onboarding (2026-10-26)

The runtime is Node v24.22.1, and the application is still a Node 12 application
(`.gitlab-ci.yml` and `Dockerfile` pin `node:12.22.6`). Every slot fails at `install`:
`node-sass` 4.14 builds from source with node-gyp 3.8, which needs Python 2 and does not
support Node 24. With install scripts skipped, on Node 24: jest passes (123 tests, 1
skipped, ProxifyUrl excluded); `yarn build` fails in webpack 4 with
`ERR_OSSL_EVP_UNSUPPORTED` (md4 hashing under OpenSSL 3); `eslint src/` reports 502
errors and 126 warnings (as on Node 12; CI allows it to fail). Moving the application to
Node 24 is the open port issue.

#!/usr/bin/env bash
# Run the checks named after the suite and write test-results/<suite>/junit.xml.
#
#   .aidev/run-checks.sh <suite> <step>...
#
# Every run first installs node_modules offline from the image's yarn cache
# (`yarn install --offline --frozen-lockfile`, lifecycle scripts included, so a
# native module's install script runs here) as the `install` case. Steps,
# one junit case each (`test` also keeps jest's own junit as jest-junit.xml when
# the installed jest can write one):
#
#   test   jest (package.json `ci:test`, CI's run-unit-tests job): src/**/*.test.js
#          without the files in JEST_ALREADY_FAILING below
#   lint   eslint src/ (package.json `ci:eslint`, CI's run-eslint job)
#   build  `yarn build`: webpack production bundle + babel of src/ into lib/
#          (what the Dockerfile's build stage runs)
#
# Runs offline in the image of .aidev/runtime/Dockerfile (Node from
# common-ci-configuration's node-test-tools).
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
root="$PWD"
suite="${1:?usage: $0 <suite> <step>...}"; shift
out="$root/test-results/$suite"
rm -rf "$out"; mkdir -p "$out"
cases="$out/cases.tsv"; : > "$cases"
source .aidev/junit-helpers.sh
printf 'property\tnode\t%s\n' "$(node --version)" >> "$cases"

status=0
step() {
    local name="$1"; shift
    local log="$out/$name.log" t0=$SECONDS rc=0
    echo "== $name" >&2
    ( cd "$root" && "$@" ) > "$log" 2>&1 < /dev/null || rc=$?
    if [ "$rc" -eq 0 ]; then
        printf 'case\t%s\tpass\t%s\t\n' "$name" "$((SECONDS - t0))" >> "$cases"
    else
        status=1; tail -40 "$log" >&2
        printf 'case\t%s\tfail\t%s\texit %s\t%s\n' "$name" "$((SECONDS - t0))" "$rc" "$log" >> "$cases"
    fi
    return "$rc"
}

# node_modules is reinstalled when yarn.lock, package.json or the Node version
# moved since the last successful install (a marker records them).
install() {
    local id marker=node_modules/.aidev-yarn-lock
    id="$(cat yarn.lock package.json | sha256sum | cut -d' ' -f1) $(node --version)"
    if [ "$(cat "$marker" 2>/dev/null)" = "$id" ] && [ -x node_modules/.bin/jest ]; then
        echo "node_modules is current for yarn.lock"; return 0
    fi
    rm -f "$marker"
    yarn install --offline --frozen-lockfile --non-interactive || return 1
    printf '%s\n' "$id" > "$marker"
}
if ! step install install; then
    junit_write_cases "$out/junit.xml" "$suite" "$cases"
    exit 1
fi

# Test files left out of every slot (jest --testPathIgnorePatterns), failing on
# the default branch on any Node; see .aidev/README.md.
JEST_ALREADY_FAILING=(
    'src/app/utils/ProxifyUrl\.test\.js$'
)

unit() {
    local args=(--ci --coverage --coverageDirectory "$out/coverage")
    local p
    for p in "${JEST_ALREADY_FAILING[@]}"; do args+=(--testPathIgnorePatterns "$p"); done
    # jest-junit is not a dependency at onboarding; use it when the tree has one.
    if [ -d node_modules/jest-junit ]; then
        args+=(--reporters=default --reporters=jest-junit)
        export JEST_JUNIT_OUTPUT_DIR="$out" JEST_JUNIT_OUTPUT_NAME=jest-junit.xml \
            JEST_JUNIT_OUTPUT="$out/jest-junit.xml"
    fi
    node_modules/.bin/jest "${args[@]}"
}

for s in "$@"; do
    case "$s" in
        test) step test unit ;;
        lint) step lint node_modules/.bin/eslint src/ ;;
        build) step build yarn run build ;;
        *) printf 'case\t%s\tfail\t0\tunknown step\n' "$s" >> "$cases"; status=1 ;;
    esac
done
junit_write_cases "$out/junit.xml" "$suite" "$cases"
exit "$status"

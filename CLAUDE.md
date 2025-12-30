# Hive Wallet - CLAUDE.md

## Project Overview

React.js web interface to the Hive blockchain social media platform. Combines server-side rendering (SSR) with client-side React, providing wallet functionality and account management for the Hive blockchain ecosystem. Production URL: wallet.hive.blog

## Tech Stack

**Frontend:**
- React 15.6.2, Redux 3.7.2, Redux-Saga 0.16.0
- React Router 3.2.0, Redux-Form 5.3.4
- Webpack 4, Babel 7
- SCSS with Foundation Sites (custom fork)

**Backend:**
- Koa 1.4.1 (Node.js server)
- Server-side rendering
- Session management, CSRF protection, Helmet security headers

**Blockchain:**
- @hiveio/hive-js 2.0.4
- HiveAuth, HiveSigner for authentication
- Chain ID: beeab0de00000000000000000000000000000000000000000000000000000000

**Database:**
- MySQL via Sequelize 5.15.1 ORM

**Testing:**
- Jest 23.x, Enzyme 3.3.0
- Nightwatch (E2E/Selenium)

## Directory Structure

```
src/
├── app/                    # Frontend React application
│   ├── components/
│   │   ├── pages/         # Page components (135 .jsx files)
│   │   ├── modules/       # Reusable module components
│   │   ├── cards/         # Card UI components
│   │   └── elements/      # Basic UI elements
│   ├── redux/             # Redux reducers & sagas
│   ├── assets/            # Images, stylesheets, static files
│   ├── locales/           # i18n (en, ja, ru, zh, fr, pl, es, it)
│   ├── utils/
│   └── Main.js            # Client entry point
├── server/                 # Koa server & SSR
│   ├── server.js          # Koa app setup
│   ├── index.js           # Server initialization
│   ├── api/               # API endpoints
│   └── app_render.jsx     # SSR render logic
├── db/                     # Sequelize models & migrations
│   ├── models/
│   └── migrations/
└── shared/                 # Isomorphic code (client + server)

webpack/                    # Webpack configs (base, dev, prod)
config/                     # App config (default.json, env var mappings)
blackboxtest/               # Selenium E2E tests
```

## Development Commands

```bash
# Install dependencies
yarn install --frozen-lockfile

# Development (webpack-dev-server, ~60s startup)
yarn start

# Production build
yarn build

# Run production server
yarn production

# Debug mode (Chrome DevTools)
yarn debug

# Testing
yarn test                   # Run Jest tests
yarn ci:test               # CI test with coverage

# Linting & Formatting
yarn eslint                # Lint modified files only
yarn ci:eslint             # Lint all src/
yarn eslint:fix            # Auto-fix issues
yarn fmt                   # Format with Prettier

# Storybook
yarn storybook             # Component docs on port 9001

# Database migrations
cd src/db && yarn exec sequelize db:migrate

# Validate translations
yarn checktranslations
```

## Key Files

| File | Purpose |
|------|---------|
| `src/app/Main.js` | Client entry point |
| `src/server/index.js` | Server entry point |
| `src/server/server.js` | Koa middleware & routes |
| `src/app/redux/RootReducer.js` | Redux store structure |
| `src/shared/UniversalRender.jsx` | SSR/client render |
| `config/default.json` | Default configuration |
| `config/custom-environment-variables.json` | Env var mappings |
| `webpack/base.config.js` | Webpack shared config |

## Coding Conventions

**Code Style:**
- Prettier: 4-space tabs, single quotes, 120 char width, trailing commas (es5)
- ESLint: Airbnb config (modified to warnings)
- CamelCase for JS/JSX files, lowercase directories

**React:**
- Class-based components (React 15 era)
- BEM CSS methodology
- Component stylesheets co-located with components

**Redux:**
- Reducers: `*Reducer.js` (AppReducer, GlobalReducer, MarketReducer, etc.)
- Sagas: `*Saga.js` for async side effects (AuthSaga, FetchDataSaga, etc.)

**Testing:**
- Test files: `*.test.js` / `*.test.jsx` colocated with source
- Mocks in `src/__mocks__/`

## CI/CD Notes

**.gitlab-ci.yml Pipeline:**

| Stage | Jobs |
|-------|------|
| test | `run-unit-tests` (yarn ci:test), `run-eslint` |
| build | `build-review-app` (MRs), `build-development` (develop), `build-production` (master) |
| deploy | `deploy-review-app` (MRs), `deploy-staging` (develop), `deploy-production` (master) |

**Branches:**
- `develop` - Protected, deploys to staging-wallet.hive.io
- `master` - Protected, deploys to wallet.hive.blog

**Docker:**
- Multi-stage Dockerfile (development -> dependencies -> production Alpine)
- Registry: hiveio/wallet (Docker Hub)
- Healthcheck: `/.well-known/healthcheck.json`

## Environment Variables

Key env vars (prefix `SDC_`):
- `SDC_DATABASE_URL` - MySQL connection string
- `SDC_CLIENT_HIVED_URL` / `SDC_SERVER_HIVED_URL` - Blockchain API endpoints
- `SDC_SESSION_SECRETKEY` - Server session encryption
- `SDC_RECAPTCHA_SITE_KEY` / `SDC_RECAPTCHA_SECRET_KEY`
- `SDC_SENDGRID_*`, `SDC_TWILIO_*` - External services
- `SDC_DISABLE_SIGNUPS`, `SDC_READONLY_MODE` - Feature flags

## Node Version

- Minimum: Node 8.7.0
- Recommended: Node 12.22.1
- Yarn preferred over npm

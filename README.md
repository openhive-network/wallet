# Hive.Blog


Hive.blog is the react.js web interface to the world's best
blockchain-based social media platform, hive.blog.  It uses
[HIVE](https://github.com/openhive-network/hive), a blockchain powered by DPoS Governance and ChainBase DB to store JSON-based content for a plethora of web
applications.   

## Why would I want to use Hive.blog?

* Learning how to build blockchain-based web applications using HIVE as a
  content storage mechanism in react.js
* Reviewing the inner workings of the hive.blog social media platform
* Assisting with software development for hive.blog

## Installation

## Building from source without docker (the 'traditional' way):
(better if you're planning to do wallet development)

#### Clone the repository and make a tmp folder

```bash
git clone https://gitlab.syncad.com/hive/wallet.git
cd wallet
mkdir tmp
```

#### Install dependencies

Install at least Node v12.22.1 if you don't already have it. We recommend using
`nvm` to do this as it's both the simplest way to install and manage
installed version(s) of node. If you need `nvm`, you can get it at
[https://github.com/creationix/nvm](https://github.com/creationix/nvm).

Wallet is known to successfully build using node 12.22.1, npm 7.19.1, and
yarn 1.22.17 (more recent versions will probably work, but node needs to be at least version 12.22.1).

Using nvm, you would install like this:

```bash
nvm install v12.22.1
```

We use the yarn package manager instead of the default `npm`. There are
multiple reasons for this, one being that we have `hive-js` built from
source pulling the github repo as part of the build process and yarn
supports this. This way the library that handles keys can be loaded by
commit hash instead of a version name and cryptographically verified to be
exactly what we expect it to be. Yarn can be installed with `npm`, but
afterwards you will not need to use `npm` further.

```bash
npm install -g yarn
yarn global add babel-cli
yarn install --frozen-lockfile --ignore-optional
yarn run build
```
To run wallet in production mode, run:

```bash
yarn run production
```

When launching wallet in production mode it will automatically use 1
process per available core. You will be able to access the front-end at
http://localhost:8080 by default.

To run condenser in development mode, run:

```bash
yarn run start
```

It will take quite a bit longer to start in this mode (~60s) as it needs to
build and start the webpack-dev-server.

By default you will be connected to hive.blog's public hive node at
`https://api.hive.blog`. This is actually on the real blockchain and
you would use your regular account name and credentials to login - there is
not an official separate testnet at this time. If you intend to run a
full-fledged site relying on your own, we recommend looking into running a
copy of `hived` locally instead
[https://github.com/openhive-network/hive](https://github.com/openhive-network/hive).

#### Debugging SSR code

`yarn debug` will build a development version of the codebase and then start the
local server with `--inspect-brk` so that you can connect a debugging client.
You can use Chromium to connect by finding the remote client at
`chrome://inspect/#devices`.

#### Configuration

The intention is to configure condenser using environment variables. You
can see the names of all of the available configuration environment
variables in `config/custom-environment-variables.json`. Default values are
stored in `config/defaults.json`.

Environment variables using an example like this:

```bash
export SDC_CLIENT_HIVED_URL="https://api.hive.blog"
export SDC_SERVER_HIVED_URL="https://api.hive.blog"
```

Keep in mind environment variables only exist in your active session, so if
you wish to save them for later use you can put them all in a file and
`source` them in.

If you'd like to statically configure condenser without variables you can
edit the settings directly in `config/production.json`. If you're running
in development mode, copy `config/production.json` to `config/dev.json`
with `cp config/production.json config/dev.json` and adjust settings in
`dev.json`.

If you're intending to run condenser in a production environment one
configuration option that you will definitely want to edit is
`server_session_secret` which can be set by the environment variable
`SDC_SESSION_SECRETKEY`. To generate a new value for this setting, you can
do this:

```bash
node
> crypto.randomBytes(32).toString('base64')
> .exit
```

## Install mysql server (optional for development, wallet will function without it)

If you've followed the instructions up until this point you will already
have a running wallet installation which is entirely acceptable for
development purposes. It is *not required to run a SQL server for
development*. If you're running a full-fledged site however, you will want
to set one up.

Once set up, you can set the mysql server configuration option for
condenser using the environment variable `SDC_DATABASE_URL`, or
alternatively by editing it in `config/production.json`. You will use the
format `mysql://user:pass@hostname/databasename`.

Example:

```bash
export SDC_DATABASE_URL="mysql://root:password@127.0.0.1/steemit_dev"
```

Here are instructions for setting up a mysql server and running the
necessary migrations by operating system:

OS X:

```bash
brew update
brew doctor
brew upgrade
brew install mysql
mysql.server restart
```

Debian based Linux:

```bash
sudo apt-get update
sudo apt-get install mysql-server
```

On Ubuntu 16.04+ you may be unable to connect to mysql without root access,
if so update the mysql root user as follows:

```
sudo mysql -u root
DROP USER 'root'@'localhost';
CREATE USER 'root'@'%' IDENTIFIED BY '';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

Now launch mysql client and create steemit_dev database:
```bash
mysql -u root
> create database steemit_dev;
> quit
```

### Database migrations

This is a required step in order for the database to be 'ready' for
condenser's use.

Edit the file `src/db/config/config.json` using your favorite command line
text editor being sure that the username, password, host, and database name
are set correctly and match your newly configured mysql setup.

Run `sequelize db:migrate` in `src/db` directory, like this:

```bash
cd src/db
yarn exec sequelize db:migrate
```

## Style Guides For Submitting Pull Requests

### File naming and location

- Prefer CamelCase js and jsx file names
- Prefer lower case one word directory names
- Keep stylesheet files close to components
- Component's stylesheet file name should match component name

#### Js & Jsx

We use [prettier](https://github.com/prettier/prettier) to autofromat the
code, with [this configuration](.prettierrc). Run `yarn run fmt` to format
everything in `src/`, or `yarn exec -- prettier --config .prettierrc
--write src/whatever/file.js` for a specific file.

#### CSS & SCSS

If a component requires a css rule, please use its uppercase name for the
class, e.g. "Header" class for the header's root div.  We adhere to BEM
methodology with exception for Foundation classes, here is an example for
the Header component:

```html
<!-- Block -->
<ul class="Header">
  ...
  <!-- Element -->
  <li class="Header__menu-item">Menu Item 1</li>
  <!-- Element with modifier -->
  <li class="Header__menu-item--selected">Element with modifier</li>
</ul>
```

## Storybook

`yarn run storybook`

## Testing

### Run test suite

`yarn test`

will run `jest`

### Test endpoints offline

If you want to test a server-side rendered page without using the network, do this:

```
yarn build
OFFLINE_SSR_TEST=true SDC_DATABASE_URL="mysql://root@127.0.0.1/steemit_dev" NODE_ENV=production node --prof lib/server/index.js
```

This will read data from the blobs in `api_mockdata` directory. If you want to use another set of mock data, create a similar directory to that one and add an argument `OFFLINE_SSR_TEST_DATA_DIR` pointing to your new directory.

### Run blackbox tests using nightwatch

To run a Selenium test suite, start the condenser docker image with a name `condenser` (like `docker run --name condenser -itp 8080:8080 steemit/condenser:latest`) and then run the blackboxtest image attached to the condneser image's network:

```
docker build -t=steemit/condenser-blackboxtest blackboxtest/
docker run --network container:condenser steemit/condenser-blackboxtest:latest

```

## Issues

To report a non-critical issue, please file an issue on this GitHub project.

If you find a security issue please report details to: security@hive.blog

We will evaluate the risk and make a patch available before filing the issue.

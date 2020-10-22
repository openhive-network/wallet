'use strict';

var api = require('./api');
var auth = require('./auth');
var memo = require('./auth/memo');
var broadcast = require('./broadcast');
var config = require('./config');
var formatter = require('./formatter')(api);
var utils = require('./utils');

var hive = {
    api: api,
    auth: auth,
    memo: memo,
    broadcast: broadcast,
    config: config,
    formatter: formatter,
    utils: utils,
};

if (typeof window !== 'undefined') {
    window.hive = hive;
}

if (typeof global !== 'undefined') {
    global.hive = hive;
}

exports = module.exports = hive;

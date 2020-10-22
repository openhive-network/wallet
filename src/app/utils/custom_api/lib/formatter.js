'use strict';

var _slicedToArray = (function () {
    function sliceIterator(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;
        try {
            for (
                var _i = arr[Symbol.iterator](), _s;
                !(_n = (_s = _i.next()).done);
                _n = true
            ) {
                _arr.push(_s.value);
                if (i && _arr.length === i) break;
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i['return']) _i['return']();
            } finally {
                if (_d) throw _e;
            }
        }
        return _arr;
    }
    return function (arr, i) {
        if (Array.isArray(arr)) {
            return arr;
        } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i);
        } else {
            throw new TypeError(
                'Invalid attempt to destructure non-iterable instance'
            );
        }
    };
})();

var _get = require('lodash/get');

var _get2 = _interopRequireDefault(_get);

var _ecc = require('./auth/ecc');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var hiveVar = function hiveVar() {
    return _config2.default.get('rebranded_api') ? 'hive' : 'steem';
};
var hbdVar = function hbdVar() {
    return _config2.default.get('rebranded_api') ? 'hbd' : 'sbd';
};

module.exports = function (hiveAPI) {
    function numberWithCommas(x) {
        return x.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Deprecating - Replacement: vestingHive
    function vestingSteem(account, gprops) {
        var vests = parseFloat(account.vesting_shares.split(' ')[0]);
        var total_vests = parseFloat(gprops.total_vesting_shares.split(' ')[0]);
        var total_vest_hive = parseFloat(
            gprops['total_vesting_fund_' + hiveVar()].split(' ')[0]
        );
        var vesting_hivef = total_vest_hive * (vests / total_vests);
        return vesting_hivef;
    }
    var vestingHive = vestingSteem;

    function processOrders(open_orders, assetPrecision) {
        var hbdOrders = !open_orders
            ? 0
            : open_orders.reduce(function (o, order) {
                  if (order.sell_price.base.indexOf('HBD') !== -1) {
                      o += order.for_sale;
                  }
                  return o;
              }, 0) / assetPrecision;

        var hiveOrders = !open_orders
            ? 0
            : open_orders.reduce(function (o, order) {
                  if (order.sell_price.base.indexOf('HIVE') !== -1) {
                      o += order.for_sale;
                  }
                  return o;
              }, 0) / assetPrecision;

        return { hiveOrders: hiveOrders, hbdOrders: hbdOrders };
    }

    function calculateSaving(savings_withdraws) {
        var savings_pending = 0;
        var savings_hbd_pending = 0;
        savings_withdraws.forEach(function (withdraw) {
            var _withdraw$amount$spli = withdraw.amount.split(' '),
                _withdraw$amount$spli2 = _slicedToArray(
                    _withdraw$amount$spli,
                    2
                ),
                amount = _withdraw$amount$spli2[0],
                asset = _withdraw$amount$spli2[1];

            if (asset === 'HIVE') savings_pending += parseFloat(amount);
            else {
                if (asset === 'HBD') savings_hbd_pending += parseFloat(amount);
            }
        });
        return {
            savings_pending: savings_pending,
            savings_hbd_pending: savings_hbd_pending,
        };
    }

    // Deprecating - Replacement: pricePerHive
    function pricePerSteem(feed_price) {
        var price_per_hive = undefined;
        var base = feed_price.base,
            quote = feed_price.quote;

        if (/ HBD$/.test(base) && / HIVE$/.test(quote)) {
            price_per_hive =
                parseFloat(base.split(' ')[0]) /
                parseFloat(quote.split(' ')[0]);
        }
        return price_per_hive;
    }
    var pricePerHive = pricePerSteem;

    // TODO: remove vesting_steem
    function estimateAccountValue(account) {
        var _ref =
                arguments.length > 1 && arguments[1] !== undefined
                    ? arguments[1]
                    : {},
            gprops = _ref.gprops,
            feed_price = _ref.feed_price,
            open_orders = _ref.open_orders,
            savings_withdraws = _ref.savings_withdraws,
            vesting_steem = _ref.vesting_steem,
            vesting_hive = _ref.vesting_hive;

        var promises = [];
        var username = account.name;
        var assetPrecision = 1000;
        var orders = void 0,
            savings = void 0;

        // TODO: remove vesting_steem
        // this is necessary to work with unbranded apis
        if (vesting_steem) {
            vesting_hive = vesting_steem;
        }
        if (!vesting_hive || !feed_price) {
            if (!gprops || !feed_price) {
                promises.push(
                    hiveAPI
                        .getStateAsync('/@' + username)
                        .then(function (data) {
                            gprops = data.props;
                            feed_price = data.feed_price;
                            vesting_hive = vestingHive(account, gprops);
                        })
                );
            } else {
                vesting_hive = vestingHive(account, gprops);
            }
        }

        if (!open_orders) {
            promises.push(
                hiveAPI
                    .getOpenOrdersAsync(username)
                    .then(function (open_orders) {
                        orders = processOrders(open_orders, assetPrecision);
                    })
            );
        } else {
            orders = processOrders(open_orders, assetPrecision);
        }

        if (!savings_withdraws) {
            promises.push(
                hiveAPI
                    .getSavingsWithdrawFromAsync(username)
                    .then(function (savings_withdraws) {
                        savings = calculateSaving(savings_withdraws);
                    })
            );
        } else {
            savings = calculateSaving(savings_withdraws);
        }

        return Promise.all(promises).then(function () {
            var price_per_hive = pricePerHive(feed_price);

            var savings_balance = account.savings_balance;
            var savings_hbd_balance =
                account['savings_' + hbdVar() + '_balance'];
            var balance_hive = parseFloat(account.balance.split(' ')[0]);
            var saving_balance_hive = parseFloat(savings_balance.split(' ')[0]);
            var hbd_balance = parseFloat(account[hbdVar() + '_balance']);
            var hbd_balance_savings = parseFloat(
                savings_hbd_balance.split(' ')[0]
            );

            var conversionValue = 0;
            var currentTime = new Date().getTime();
            (account.other_history || []).reduce(function (out, item) {
                if ((0, _get2.default)(item, [1, 'op', 0], '') !== 'convert')
                    return out;

                var timestamp = new Date(
                    (0, _get2.default)(item, [1, 'timestamp'])
                ).getTime();
                var finishTime = timestamp + 86400000 * 3.5; // add 3.5day conversion delay
                if (finishTime < currentTime) return out;

                var amount = parseFloat(
                    (0, _get2.default)(item, [1, 'op', 1, 'amount']).replace(
                        ' HBD',
                        ''
                    )
                );
                conversionValue += amount;
            }, []);

            var total_hbd =
                hbd_balance +
                hbd_balance_savings +
                savings.savings_hbd_pending +
                orders.hbdOrders +
                conversionValue;

            var total_hive =
                vesting_hive +
                balance_hive +
                saving_balance_hive +
                savings.savings_pending +
                orders.hiveOrders;

            return (total_hive * price_per_hive + total_hbd).toFixed(2);
        });
    }

    function createSuggestedPassword() {
        var PASSWORD_LENGTH = 32;
        var privateKey = _ecc.key_utils.get_random_key();
        return privateKey.toWif().substring(3, 3 + PASSWORD_LENGTH);
    }

    return {
        reputation: function reputation(_reputation) {
            if (_reputation == null) return _reputation;
            var neg = _reputation < 0;
            var rep = String(_reputation);
            rep = neg ? rep.substring(1) : rep;
            var v = Math.log10((rep > 0 ? rep : -rep) - 10) - 9;
            v = neg ? -v : v;
            return parseInt(v * 9 + 25);
        },

        // Deprecated - Remove on future releases
        vestToSteem: function vestToSteem(
            vestingShares,
            totalVestingShares,
            totalVestingFundSteem
        ) {
            console.warn(
                'vestToSteem() is deprecated and will be removed in the future releases. Use vestToHive() instead.'
            );
            return (
                parseFloat(totalVestingFundSteem) *
                (parseFloat(vestingShares) / parseFloat(totalVestingShares))
            );
        },

        // Same as vestToSteem
        vestToHive: function vestToHive(
            vestingShares,
            totalVestingShares,
            totalVestingFundHive
        ) {
            return (
                parseFloat(totalVestingFundHive) *
                (parseFloat(vestingShares) / parseFloat(totalVestingShares))
            );
        },

        commentPermlink: function commentPermlink(
            parentAuthor,
            parentPermlink
        ) {
            var timeStr = new Date()
                .toISOString()
                .replace(/[^a-zA-Z0-9]+/g, '')
                .toLowerCase();
            parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '');
            return 're-' + parentAuthor + '-' + parentPermlink + '-' + timeStr;
        },

        amount: function amount(_amount, asset) {
            return _amount.toFixed(3) + ' ' + asset;
        },
        numberWithCommas: numberWithCommas,
        vestingSteem: vestingSteem,
        vestingHive: vestingHive,
        estimateAccountValue: estimateAccountValue,
        createSuggestedPassword: createSuggestedPassword,
        pricePerSteem: pricePerSteem,
        pricePerHive: pricePerHive,
    };
};

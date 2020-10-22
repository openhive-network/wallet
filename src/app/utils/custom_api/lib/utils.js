'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true,
});
exports.camelCase = camelCase;
exports.validateAccountName = validateAccountName;
exports.buildWitnessUpdateOp = buildWitnessUpdateOp;
exports.autoDetectApiVersion = autoDetectApiVersion;

var _types = require('./auth/serializer/src/types');

var _types2 = _interopRequireDefault(_types);

var _serializer = require('./auth/serializer/src/serializer');

var _serializer2 = _interopRequireDefault(_serializer);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _http = require('./api/transports/http');

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ByteBuffer = require('bytebuffer');

var uint16 = _types2.default.uint16,
    uint32 = _types2.default.uint32,
    string = _types2.default.string,
    public_key = _types2.default.public_key,
    asset = _types2.default.asset;

var snakeCaseRe = /_([a-z])/g;
function camelCase(str) {
    return str.replace(snakeCaseRe, function (_m, l) {
        return l.toUpperCase();
    });
}

function validateAccountName(value) {
    var i = void 0,
        label = void 0,
        len = void 0,
        suffix = void 0;

    suffix = 'Account name should ';
    if (!value) {
        return suffix + 'not be empty.';
    }
    var length = value.length;
    if (length < 3) {
        return suffix + 'be longer.';
    }
    if (length > 16) {
        return suffix + 'be shorter.';
    }
    if (/\./.test(value)) {
        suffix = 'Each account segment should ';
    }
    var ref = value.split('.');
    for (i = 0, len = ref.length; i < len; i++) {
        label = ref[i];
        if (!/^[a-z]/.test(label)) {
            return suffix + 'start with a letter.';
        }
        if (!/^[a-z0-9-]*$/.test(label)) {
            return suffix + 'have only letters, digits, or dashes.';
        }
        if (/--/.test(label)) {
            return suffix + 'have only one dash in a row.';
        }
        if (!/[a-z0-9]$/.test(label)) {
            return suffix + 'end with a letter or digit.';
        }
        if (!(label.length >= 3)) {
            return suffix + 'be longer';
        }
    }
    return null;
}

// Hack to be able to generate a valid witness_set_properties op
// Can hopefully be removed when hived's JSON representation is fixed
var price = new _serializer2.default('price', {
    base: asset,
    quote: asset,
});

function serialize(serializer, data) {
    var buffer = new ByteBuffer(
        ByteBuffer.DEFAULT_CAPACITY,
        ByteBuffer.LITTLE_ENDIAN
    );
    serializer.appendByteBuffer(buffer, data);
    buffer.flip();
    return buffer.toString('hex');
}
function buildWitnessUpdateOp(owner, props) {
    var data = {
        extensions: [],
        owner: owner,
        props: [],
    };
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (
            var _iterator = Object.keys(props)[Symbol.iterator](), _step;
            !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
            _iteratorNormalCompletion = true
        ) {
            var key = _step.value;

            var type = void 0;
            switch (key) {
                case 'key':
                case 'new_signing_key':
                    type = public_key;
                    break;
                case 'account_subsidy_budget':
                case 'account_subsidy_decay':
                case 'maximum_block_size':
                    type = uint32;
                    break;
                // TODO: remove sbd_interest_rate
                case 'sbd_interest_rate':
                    type = uint16;
                    break;
                case 'hbd_interest_rate':
                    type = uint16;
                    break;
                case 'url':
                    type = string;
                    break;
                // TODO: remove sbd_exchange_rate
                case 'sbd_exchange_rate':
                    type = price;
                    break;
                case 'hbd_exchange_rate':
                    type = price;
                    break;
                case 'account_creation_fee':
                    type = asset;
                    break;
                default:
                    throw new Error('Unknown witness prop: ' + key);
            }
            data.props.push([key, serialize(type, props[key])]);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    data.props.sort(function (a, b) {
        return a[0].localeCompare(b[0]);
    });
    return ['witness_set_properties', data];
}

function autoDetectApiVersion() {
    return new Promise(function (resolve, reject) {
        (0, _http.jsonRpc)(_config2.default.get('url'), {
            method: 'condenser_api.get_version',
            params: [],
            id: 1,
        }).then(function (res) {
            if (res.blockchain_version !== '0.23.0') {
                _config2.default.set('rebranded_api', true);
                resolve({ rebranded_api: true });
            } else {
                _config2.default.set('rebranded_api', false);
                resolve({ rebranded_api: false });
            }
        });
    });
}

import { call, put, select, takeEvery } from 'redux-saga/effects';
import { Set, Map, fromJS, List } from 'immutable';
import { api } from '@hiveio/hive-js';
import { PrivateKey } from '@hiveio/hive-js/lib/auth/ecc';

import { getAccount } from 'app/redux/SagaShared';
import * as userActions from 'app/redux/UserReducer';

// operations that require only posting authority
export const postingOps = Set(
    `vote, comment, delete_comment, custom_json, claim_reward_balance`
        .trim()
        .split(/,\s*/)
);

export const authWatches = [
    takeEvery('user/ACCOUNT_AUTH_LOOKUP', accountAuthLookup),
];

export function* accountAuthLookup({
    payload: { account, private_keys, login_owner_pubkey },
}) {
    account = fromJS(account);
    private_keys = fromJS(private_keys);
    const stateUser = yield select((state) => state.user);
    let keys;
    if (private_keys) keys = private_keys;
    else keys = stateUser.getIn(['current', 'private_keys']);

    if (!keys || !keys.has('posting_private')) return;
    const toPub = (k) => (k ? k.toPublicKey().toString() : '-');
    const posting = keys.get('posting_private');
    const active = keys.get('active_private');
    const owner = keys.get('owner_private');
    const memo = keys.get('memo_private');
    const auth = {
        posting: posting
            ? yield authorityLookup({
                  pubkeys: Set([toPub(posting)]),
                  authority: account.get('posting'),
                  authType: 'posting',
              })
            : 'none',
        active: active
            ? yield authorityLookup({
                  pubkeys: Set([toPub(active)]),
                  authority: account.get('active'),
                  authType: 'active',
              })
            : 'none',
        owner: owner
            ? yield authorityLookup({
                  pubkeys: Set([toPub(owner)]),
                  authority: account.get('owner'),
                  authType: 'owner',
              })
            : 'none',
        memo: account.get('memo_key') === toPub(memo) ? 'full' : 'none',
    };
    const accountName = account.get('name');
    const pub_keys_used = {
        posting: toPub(posting),
        active: toPub(active),
        owner: login_owner_pubkey,
    };
    yield put(userActions.setAuthority({ accountName, auth, pub_keys_used }));
}

/**
    @arg {object} data
    @arg {object} data.authority Immutable Map blockchain authority
    @arg {object} data.pubkeys Immutable Set public key strings
    @return {string} full, partial, none
*/
function* authorityLookup({ pubkeys, authority, authType }) {
    return yield call(authStr, { pubkeys, authority, authType });
}

function* authStr({ pubkeys, authority, authType, recurse = 1 }) {
    const t = yield call(threshold, {
        pubkeys,
        authority,
        authType,
        recurse,
    });
    const r = authority.get('weight_threshold');
    return t >= r ? 'full' : t > 0 ? 'partial' : 'none';
}

export function* threshold({ pubkeys, authority, authType, recurse = 1 }) {
    if (!pubkeys.size) return 0;
    let t = pubkeyThreshold({ pubkeys, authority });
    const account_auths = authority.get('account_auths');
    const aaNames = account_auths.map((v) => v.get(0), List());
    if (aaNames.size) {
        const aaAccounts = yield api.getAccountsAsync(aaNames);
        const aaThreshes = account_auths.map((v) => v.get(1), List());
        for (let i = 0; i < aaAccounts.size; i++) {
            const aaAccount = aaAccounts.get(i);
            t += pubkeyThreshold({
                authority: aaAccount.get(authType),
                pubkeys,
            });
            if (recurse <= 2) {
                const auth = yield call(authStr, {
                    authority: aaAccount,
                    pubkeys,
                    recurse: ++recurse,
                });
                if (auth === 'full') {
                    const aaThresh = aaThreshes.get(i);
                    t += aaThresh;
                }
            }
        }
    }
    return t;
}

function pubkeyThreshold({ pubkeys, authority }) {
    let available = 0;
    const key_auths = authority.get('key_auths');
    key_auths.forEach((k) => {
        if (pubkeys.has(k.get(0))) {
            available += k.get(1);
        }
    });
    return available;
}

export function* findSigningKey({ opType, username, password }) {
    let authTypes;
    if (postingOps.has(opType)) authTypes = 'posting, active';
    else authTypes = 'active, owner';
    authTypes = authTypes.split(', ');

    const currentUser = yield select((state) => state.user.get('current'));
    const currentUsername = currentUser && currentUser.get('username');

    username = username || currentUsername;
    if (!username) return null;

    if (username.indexOf('/') > -1) {
        // "alice/active" will login only with Alices active key
        username = username.split('/')[0];
    }

    const private_keys =
        currentUsername === username ? currentUser.get('private_keys') : Map();

    const account = yield call(getAccount, username);
    if (!account) throw new Error('Account not found');

    for (const authType of authTypes) {
        let private_key;
        if (password) {
            try {
                private_key = PrivateKey.fromWif(password);
            } catch (e) {
                private_key = PrivateKey.fromSeed(
                    username + authType + password
                );
            }
        } else if (private_keys)
            private_key = private_keys.get(authType + '_private');
        if (private_key) {
            const pubkey = private_key.toPublicKey().toString();
            const pubkeys = Set([pubkey]);
            const authority = account.get(authType);
            const auth = yield call(authorityLookup, {
                pubkeys,
                authority,
                authType,
            });
            if (auth === 'full') return private_key;
        }
    }
    return null;
}

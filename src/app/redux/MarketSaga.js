import { call, put, takeLatest } from 'redux-saga/effects';
import { api } from '@hiveio/hive-js';

import * as marketActions from './MarketReducer';
import * as appActions from './AppReducer';
import * as userActions from './UserReducer';
import { getAccount } from './SagaShared';

export const marketWatches = [
    takeLatest(userActions.SET_USER, fetchOpenOrders),
    takeLatest('@@router/LOCATION_CHANGE', fetchMarket),
    takeLatest(marketActions.UPDATE_MARKET, reloadMarket),
];

export const wait = (ms) => new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
    });

let polling = false;

export function* fetchMarket(location_change_action) {
    const { pathname } = location_change_action.payload;
    if (pathname && pathname != '/market') {
        polling = false;
        return;
    }

    if (polling === true) return;
    polling = true;

    while (polling) {
        try {
            const state = yield call([api, api.getOrderBookAsync], 500);
            yield put(marketActions.receiveOrderbook(state));

            const trades = yield call([api, api.getRecentTradesAsync], 1000);
            yield put(marketActions.receiveTradeHistory(trades));

            const state3 = yield call([api, api.getTickerAsync]);
            yield put(marketActions.receiveTicker(state3));
        } catch (error) {
            console.error('~~ Saga fetchMarket error ~~>', error);
            yield put(appActions.hiveApiError(error.message));
        }

        yield call(wait, 3000);
    }
}


export function* fetchOpenOrders(set_user_action) {
    const { username } = set_user_action.payload;

    try {
        const state = yield call([api, api.getOpenOrdersAsync], username);
        yield put(marketActions.receiveOpenOrders(state));
        yield call(getAccount, username);
    } catch (error) {
        console.error('~~ Saga fetchOpenOrders error ~~>', error);
        yield put(appActions.hiveApiError(error.message));
    }
}

export function* reloadMarket(reload_action) {
    yield fetchMarket(reload_action);
    yield fetchOpenOrders(reload_action);
}
